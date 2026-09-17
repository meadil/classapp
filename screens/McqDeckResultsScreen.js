import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

export default function McqDeckResultsScreen({ navigation, route }) {
    const { t } = useLanguage();
    const { deck } = route.params;
    const { profile } = useUser();

    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(null);
    const [review, setReview] = useState([]);

    const load = useCallback(async () => {
        setLoading(true);

        const { data: lastAttempt } = await supabase
            .from('mcq_deck_attempts')
            .select('*')
            .eq('deck_id', deck.id)
            .eq('student_id', profile.id)
            .order('submitted_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!lastAttempt) {
            setAttempt(null);
            setLoading(false);
            return;
        }

        setAttempt(lastAttempt);

        const { data: reviewData } = await supabase.rpc('get_mcq_deck_review', { p_deck_id: deck.id });
        setReview(reviewData || []);
        setLoading(false);
    }, [deck.id, profile.id]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const handleRetake = () => {
        navigation.navigate('McqDeckTaking', { deck });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            </SafeAreaView>
        );
    }

    if (!attempt) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>{t('back')}</Text>
                    </Pressable>
                    <Text style={styles.headerTitle} numberOfLines={1}>{deck.title}</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>{t('noAttemptsYet')}</Text>
                    <Pressable style={styles.startButton} onPress={handleRetake}>
                        <Text style={styles.startButtonText}>{t('startDeck')}</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>{t('back')}</Text>
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{deck.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.scoreBanner}>
                    <Text style={styles.scoreText}>{attempt.score} / {attempt.total_questions}</Text>
                    <Text style={styles.scoreSubtext}>{t('lastAttempt')}</Text>
                </View>

                <Pressable
                    style={({ pressed }) => [styles.retakeButton, pressed && { backgroundColor: colors.accentPressed }]}
                    onPress={handleRetake}
                >
                    <Text style={styles.retakeButtonText}>{t('retake')}</Text>
                </Pressable>

                {review.map((q, qi) => (
                    <View key={q.question_id} style={styles.questionCard}>
                        <Text style={styles.questionText}>{qi + 1}. {q.question_text}</Text>
                        {q.options.map((opt, oi) => {
                            const isCorrect = oi === q.correct_option_index;
                            const isSelected = oi === q.selected_option_index;
                            return (
                                <View
                                    key={oi}
                                    style={[
                                        styles.reviewOptionRow,
                                        isCorrect && styles.reviewOptionCorrect,
                                        isSelected && !isCorrect && styles.reviewOptionWrong,
                                    ]}
                                >
                                    <Text style={styles.optionText}>{opt}</Text>
                                    {isCorrect && <Text style={styles.reviewTag}>{t('correct')}</Text>}
                                    {isSelected && !isCorrect && <Text style={styles.reviewTagWrong}>{t('yourAnswer')}</Text>}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    backText: { ...typography.body, color: colors.accent },
    headerTitle: { ...typography.headline, color: colors.textPrimary, flexShrink: 1, textAlign: 'center' },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    scoreBanner: { alignItems: 'center', marginBottom: spacing.md },
    scoreText: { fontSize: 48, fontWeight: '700', color: colors.accent, marginBottom: spacing.sm },
    scoreSubtext: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    retakeButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.lg },
    retakeButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
    questionCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadow.card,
    },
    questionText: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.sm },
    optionText: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
    reviewOptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.sm,
        marginBottom: 2,
    },
    reviewOptionCorrect: { backgroundColor: '#E7F6EA' },
    reviewOptionWrong: { backgroundColor: '#FDECEA' },
    reviewTag: { ...typography.caption, color: colors.success, fontWeight: '600' },
    reviewTagWrong: { ...typography.caption, color: colors.danger, fontWeight: '600' },
    emptyText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
    startButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
    startButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});
