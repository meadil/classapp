import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

const DURATIONS = [15, 30, 45, 60];

function emptyQuestion() {
    return {
        key: Math.random().toString(36).slice(2),
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
    };
}

export default function CreateQuizScreen({ navigation, route }) {
    const editingQuiz = route.params?.quiz || null;
    const isEditing = !!editingQuiz;

    const { profile } = useUser();
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [duration, setDuration] = useState(30);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [questions, setQuestions] = useState([emptyQuestion()]);
    const [publishing, setPublishing] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(isEditing);

    useEffect(() => {
        if (!isEditing) return;

        (async () => {
            // guard: if students have already submitted, editing questions would corrupt their graded results
            const { count } = await supabase
                .from('quiz_submissions')
                .select('*', { count: 'exact', head: true })
                .eq('quiz_id', editingQuiz.id);

            if (count > 0) {
                Alert.alert(
                    'Editing locked',
                    'Students have already submitted this quiz, so it can\u2019t be edited without corrupting their results. Delete it and create a new one instead if changes are needed.'
                );
                navigation.goBack();
                return;
            }

            const { data: existingQuestions, error } = await supabase
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', editingQuiz.id)
                .order('position');

            if (error) {
                Alert.alert('Could not load quiz', error.message);
                navigation.goBack();
                return;
            }

            setTitle(editingQuiz.title);
            setStartDate(new Date(editingQuiz.opens_at));
            const mins = Math.round((new Date(editingQuiz.closes_at) - new Date(editingQuiz.opens_at)) / 60000);
            setDuration(mins);
            setQuestions(
                existingQuestions.map((q) => ({
                    key: q.id,
                    text: q.question_text,
                    options: q.options,
                    correctIndex: q.correct_option_index,
                }))
            );
            setLoadingExisting(false);
        })();
    }, []);

    const durationOptions = DURATIONS.includes(duration) ? DURATIONS : [...DURATIONS, duration].sort((a, b) => a - b);

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
        if (!title.trim()) return 'Give the quiz a title.';
        if (questions.length === 0) return 'Add at least one question.';
        for (const q of questions) {
            if (!q.text.trim()) return 'Every question needs text.';
            if (q.options.some((o) => !o.trim())) return 'Every option needs text.';
        }
        return null;
    };

    const handlePublish = async () => {
        const validationError = validate();
        if (validationError) {
            Alert.alert('Missing info', validationError);
            return;
        }

        setPublishing(true);
        const opensAt = startDate;
        const closesAt = new Date(startDate.getTime() + duration * 60 * 1000);

        let quizId = editingQuiz?.id;

        if (isEditing) {
            const { error: updateError } = await supabase
                .from('quizzes')
                .update({
                    title: title.trim(),
                    opens_at: opensAt.toISOString(),
                    closes_at: closesAt.toISOString(),
                })
                .eq('id', quizId);

            if (updateError) {
                Alert.alert('Could not save changes', updateError.message);
                setPublishing(false);
                return;
            }

            // simplest safe approach: replace all questions wholesale (guarded above to only run pre-submissions)
            const { error: deleteError } = await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
            if (deleteError) {
                Alert.alert('Could not update questions', deleteError.message);
                setPublishing(false);
                return;
            }
        } else {
            const { data: quiz, error: quizError } = await supabase
                .from('quizzes')
                .insert({
                    title: title.trim(),
                    opens_at: opensAt.toISOString(),
                    closes_at: closesAt.toISOString(),
                    created_by: profile.id,
                })
                .select()
                .single();

            if (quizError) {
                Alert.alert('Could not create quiz', quizError.message);
                setPublishing(false);
                return;
            }
            quizId = quiz.id;
        }

        const questionRows = questions.map((q, i) => ({
            quiz_id: quizId,
            question_text: q.text.trim(),
            options: q.options.map((o) => o.trim()),
            correct_option_index: q.correctIndex,
            position: i,
        }));

        const { error: questionsError } = await supabase.from('quiz_questions').insert(questionRows);

        setPublishing(false);

        if (questionsError) {
            Alert.alert('Saved, but questions failed to save', questionsError.message);
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
                    <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Quiz' : 'New Quiz'}</Text>
                <Pressable onPress={handlePublish} disabled={publishing}>
                    <Text style={[styles.publishText, publishing && { opacity: 0.4 }]}>
                        {publishing ? 'Saving…' : isEditing ? 'Save' : 'Publish'}
                    </Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.sectionLabel}>Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Week 6 — Cell Biology"
                        placeholderTextColor={colors.textTertiary}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.sectionLabel}>Opens</Text>
                    <View style={styles.row}>
                        <Pressable style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.pickerButtonText}>{startDate.toDateString()}</Text>
                        </Pressable>
                        <Pressable style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
                            <Text style={styles.pickerButtonText}>
                                {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </Pressable>
                    </View>
                    {showDatePicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            onChange={(event, date) => {
                                setShowDatePicker(Platform.OS === 'ios');
                                if (date) {
                                    const merged = new Date(startDate);
                                    merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                                    setStartDate(merged);
                                }
                            }}
                        />
                    )}
                    {showTimePicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="time"
                            onChange={(event, date) => {
                                setShowTimePicker(Platform.OS === 'ios');
                                if (date) {
                                    const merged = new Date(startDate);
                                    merged.setHours(date.getHours(), date.getMinutes());
                                    setStartDate(merged);
                                }
                            }}
                        />
                    )}

                    <Text style={styles.sectionLabel}>Duration</Text>
                    <View style={styles.row}>
                        {durationOptions.map((d) => (
                            <Pressable
                                key={d}
                                style={[styles.durationChip, duration === d && styles.durationChipActive]}
                                onPress={() => setDuration(d)}
                            >
                                <Text style={[styles.durationChipText, duration === d && styles.durationChipTextActive]}>
                                    {d} min
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.sectionLabel}>Questions</Text>
                    {questions.map((q, qi) => (
                        <View key={q.key} style={styles.questionCard}>
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>Question {qi + 1}</Text>
                                {questions.length > 1 && (
                                    <Pressable onPress={() => removeQuestion(q.key)}>
                                        <Text style={styles.removeText}>Remove</Text>
                                    </Pressable>
                                )}
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Question text"
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
                                        placeholder={`Option ${oi + 1}`}
                                        placeholderTextColor={colors.textTertiary}
                                        value={opt}
                                        onChangeText={(value) => updateOption(q.key, oi, value)}
                                    />
                                </View>
                            ))}
                            <Text style={styles.hintText}>Tap the circle next to the correct answer.</Text>
                        </View>
                    ))}

                    <Pressable style={styles.addQuestionButton} onPress={addQuestion}>
                        <Text style={styles.addQuestionText}>+ Add Question</Text>
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
    headerTitle: { ...typography.headline, color: colors.textPrimary },
    cancelText: { ...typography.body, color: colors.textSecondary },
    publishText: { ...typography.body, color: colors.accent, fontWeight: '600' },
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
    row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    pickerButton: {
        backgroundColor: colors.backgroundMuted,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    pickerButtonText: { ...typography.body, color: colors.textPrimary },
    durationChip: {
        backgroundColor: colors.backgroundMuted,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    durationChipActive: { backgroundColor: colors.accent },
    durationChipText: { ...typography.subhead, color: colors.textPrimary },
    durationChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
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