import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function McqDeckTakingScreen({ navigation, route }) {
    const { t } = useLanguage();
    const { deck } = route.params;

    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const hasSubmitted = useRef(false);
    const answersRef = useRef({});
    answersRef.current = answers;

    useEffect(() => {
        (async () => {
            const { data, error } = await supabase.rpc('get_mcq_deck_questions', { p_deck_id: deck.id });
            if (error) {
                Alert.alert(t('couldNotLoadDeck'), error.message);
                navigation.goBack();
                return;
            }
            setQuestions(data);
            setSecondsLeft(data.length * deck.minutes_per_question * 60);
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (loading) return;
        const interval = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    clearInterval(interval);
                    handleSubmit(true);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [loading]);

    const selectAnswer = (questionId, index) => {
        setAnswers((a) => ({ ...a, [questionId]: index }));
    };

    const handleSubmit = async (isAutoSubmit = false) => {
        if (hasSubmitted.current) return;

        if (!isAutoSubmit) {
            const unanswered = questions.length - Object.keys(answersRef.current).length;
            if (unanswered > 0) {
                Alert.alert(
                    t('answerEverything'),
                    t('unansweredWarning'),
                    [
                        { text: t('keepGoing'), style: 'cancel' },
                        { text: t('submitAnyway'), onPress: () => doSubmit() },
                    ]
                );
                return;
            }
        }
        doSubmit();
    };

    const doSubmit = async () => {
        if (hasSubmitted.current) return;
        hasSubmitted.current = true;
        setSubmitting(true);

        const payload = questions.map((q) => ({
            question_id: q.id,
            selected_option_index: answersRef.current[q.id] ?? -1,
        }));

        const { data, error } = await supabase.rpc('submit_mcq_deck_attempt', {
            p_deck_id: deck.id,
            p_answers: payload,
        });

        setSubmitting(false);

        if (error) {
            Alert.alert(t('couldNotSubmit'), error.message);
            hasSubmitted.current = false;
            return;
        }

        navigation.replace('McqDeckResults', { deck });
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle} numberOfLines={1}>{deck.title}</Text>
                <View style={styles.timerPill}>
                    <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {questions.map((q, qi) => (
                    <View key={q.id} style={styles.questionCard}>
                        <Text style={styles.questionText}>{qi + 1}. {q.question_text}</Text>
                        {q.options.map((opt, oi) => (
                            <Pressable key={oi} style={styles.optionRow} onPress={() => selectAnswer(q.id, oi)}>
                                <View style={[styles.radio, answers[q.id] === oi && styles.radioSelected]} />
                                <Text style={styles.optionText}>{opt}</Text>
                            </Pressable>
                        ))}
                    </View>
                ))}
                <Pressable
                    style={({ pressed }) => [styles.submitButton, pressed && { backgroundColor: colors.accentPressed }]}
                    onPress={() => handleSubmit(false)}
                    disabled={submitting}
                >
                    <Text style={styles.submitText}>{submitting ? t('submitting') : t('submit')}</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    headerTitle: { ...typography.headline, color: colors.textPrimary, flexShrink: 1, marginRight: spacing.sm },
    timerPill: {
        backgroundColor: colors.backgroundMuted,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    timerText: { ...typography.subhead, color: colors.textPrimary, fontWeight: '700', fontVariant: ['tabular-nums'] },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    questionCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadow.card,
    },
    questionText: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.sm },
    optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, marginRight: spacing.sm },
    radioSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
    optionText: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
    submitButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
    submitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});
