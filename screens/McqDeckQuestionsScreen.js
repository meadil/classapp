import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

function emptyQuestion() {
    return {
        key: Math.random().toString(36).slice(2),
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
    };
}

export default function McqDeckQuestionsScreen({ navigation, route }) {
    const { t } = useLanguage();
    const { deck } = route.params;

    const [questions, setQuestions] = useState([emptyQuestion()]);
    const [saving, setSaving] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(true);

    useEffect(() => {
        (async () => {
            const { data: existingQuestions, error } = await supabase
                .from('mcq_deck_questions')
                .select('*')
                .eq('deck_id', deck.id)
                .order('order_index');

            if (error) {
                Alert.alert(t('couldNotLoadQuestions'), error.message);
                navigation.goBack();
                return;
            }

            if (existingQuestions.length > 0) {
                setQuestions(
                    existingQuestions.map((q) => ({
                        key: q.id,
                        text: q.question_text,
                        options: q.options,
                        correctIndex: q.correct_option_index,
                    }))
                );
            }
            setLoadingExisting(false);
        })();
    }, []);

    const updateQuestion = (key, patch) => {
        setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));
    };

    const updateOption = (key, index, value) => {
        setQuestions((qs) =>
            qs.map((q) => {
                if (q.key !== key) return q;
                const options = [...q.options];
                options[index] = value;
                return { ...q, options };
            })
        );
    };

    const addQuestion = () => setQuestions((qs) => [...qs, emptyQuestion()]);
    const removeQuestion = (key) => setQuestions((qs) => qs.filter((q) => q.key !== key));

    const validate = () => {
        if (questions.length === 0) return t('addAtLeastOneQuestion');
        for (const q of questions) {
            if (!q.text.trim()) return t('everyQuestionNeedsText');
            if (q.options.some((o) => !o.trim())) return t('everyOptionNeedsText');
        }
        return null;
    };

    const handleSave = async () => {
        const validationError = validate();
        if (validationError) {
            Alert.alert(t('missingInfo'), validationError);
            return;
        }

        setSaving(true);

        // simplest safe approach: replace all questions wholesale, same as the Weekly Live Quiz editor.
        // Decks are retakeable practice — there's no "already submitted, locked" guard here, unlike quizzes.
        const { error: deleteError } = await supabase.from('mcq_deck_questions').delete().eq('deck_id', deck.id);
        if (deleteError) {
            Alert.alert(t('couldNotUpdateQuestions'), deleteError.message);
            setSaving(false);
            return;
        }

        const questionRows = questions.map((q, i) => ({
            deck_id: deck.id,
            question_text: q.text.trim(),
            options: q.options.map((o) => o.trim()),
            correct_option_index: q.correctIndex,
            order_index: i,
        }));

        const { error: insertError } = await supabase.from('mcq_deck_questions').insert(questionRows);

        setSaving(false);

        if (insertError) {
            Alert.alert(t('couldNotSaveQuestions'), insertError.message);
            return;
        }

        navigation.goBack();
    };

    if (loadingExisting) {
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
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>{t('cancel')}</Text>
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{deck.title}</Text>
                <Pressable onPress={handleSave} disabled={saving}>
                    <Text style={[styles.saveText, saving && { opacity: 0.4 }]}>
                        {saving ? t('saving') : t('save')}
                    </Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.sectionLabel}>{t('questions')}</Text>
                    {questions.map((q, qi) => (
                        <View key={q.key} style={styles.questionCard}>
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>{t('question')} {qi + 1}</Text>
                                {questions.length > 1 && (
                                    <Pressable onPress={() => removeQuestion(q.key)}>
                                        <Text style={styles.removeText}>{t('remove')}</Text>
                                    </Pressable>
                                )}
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder={t('questionTextPlaceholder')}
                                placeholderTextColor={colors.textTertiary}
                                value={q.text}
                                onChangeText={(text) => updateQuestion(q.key, { text })}
                            />
                            {q.options.map((opt, oi) => (
                                <View key={oi} style={styles.optionRow}>
                                    <Pressable
                                        style={[styles.radio, q.correctIndex === oi && styles.radioSelected]}
                                        onPress={() => updateQuestion(q.key, { correctIndex: oi })}
                                    />
                                    <TextInput
                                        style={styles.optionInput}
                                        placeholder={`${t('option')} ${oi + 1}`}
                                        placeholderTextColor={colors.textTertiary}
                                        value={opt}
                                        onChangeText={(value) => updateOption(q.key, oi, value)}
                                    />
                                </View>
                            ))}
                            <Text style={styles.hintText}>{t('tapCorrectAnswerHint')}</Text>
                        </View>
                    ))}

                    <Pressable style={styles.addQuestionButton} onPress={addQuestion}>
                        <Text style={styles.addQuestionText}>{t('addQuestion')}</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
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
    headerTitle: { ...typography.headline, color: colors.textPrimary, flexShrink: 1, textAlign: 'center' },
    cancelText: { ...typography.body, color: colors.textSecondary },
    saveText: { ...typography.body, color: colors.accent, fontWeight: '600' },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    sectionLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs, textTransform: 'uppercase' },
    input: {
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 17,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    questionCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadow.card,
    },
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    questionNumber: { ...typography.headline, color: colors.textPrimary },
    removeText: { ...typography.subhead, color: colors.danger },
    optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    radio: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: colors.border,
        marginRight: spacing.sm,
    },
    radioSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
    optionInput: {
        flex: 1,
        backgroundColor: colors.backgroundMuted,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        fontSize: 15,
        color: colors.textPrimary,
    },
    hintText: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
    addQuestionButton: { alignItems: 'center', paddingVertical: spacing.md },
    addQuestionText: { ...typography.body, color: colors.accent, fontWeight: '600' },
});
