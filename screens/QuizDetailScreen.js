import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

function getQuizState(quiz) {
    const now = new Date();
    const opens = new Date(quiz.opens_at);
    const closes = new Date(quiz.closes_at);
    if (now < opens) return 'upcoming';
    if (now < closes) return 'live';
    return 'history';
}

function Header({ title, onBack }) {
    return (
        <View style={styles.header}>
            <Pressable onPress={onBack}>
                <Text style={styles.backText}>Back</Text>
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            <View style={{ width: 40 }} />
        </View>
    );
}

// ---------- Teacher view: questions + per-student results ----------
function TeacherView({ quiz }) {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        (async () => {
            const [{ data: qData }, { data: sData }] = await Promise.all([
                supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id).order('position'),
                supabase
                    .from('quiz_submissions')
                    .select('score, total_questions, profiles(name)')
                    .eq('quiz_id', quiz.id)
                    .order('score', { ascending: false }),
            ]);
            setQuestions(qData || []);
            setSubmissions(sData || []);
            setLoading(false);
        })();
    }, []);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.sectionTitle}>Questions</Text>
            {questions.map((q, qi) => (
                <View key={q.id} style={styles.questionCard}>
                    <Text style={styles.questionText}>{qi + 1}. {q.question_text}</Text>
                    {q.options.map((opt, oi) => (
                        <View key={oi} style={styles.optionRow}>
                            <View style={[styles.dot, oi === q.correct_option_index && styles.dotCorrect]} />
                            <Text style={[styles.optionText, oi === q.correct_option_index && styles.optionTextCorrect]}>
                                {opt}
                            </Text>
                        </View>
                    ))}
                </View>
            ))}

            <Text style={styles.sectionTitle}>Results ({submissions.length})</Text>
            {submissions.length === 0 ? (
                <Text style={styles.emptyText}>No students have submitted yet.</Text>
            ) : (
                submissions.map((s, i) => (
                    <View key={i} style={styles.resultRow}>
                        <Text style={styles.resultName}>{s.profiles?.name || 'Unknown'}</Text>
                        <Text style={styles.resultScore}>{s.score} / {s.total_questions}</Text>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

// ---------- Student view: take quiz, wait, or review ----------
function StudentView({ quiz, profile, navigation }) {
    const state = getQuizState(quiz);
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [pastSubmission, setPastSubmission] = useState(null);
    const [review, setReview] = useState(null);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);

        const { data: existing } = await supabase
            .from('quiz_submissions')
            .select('*')
            .eq('quiz_id', quiz.id)
            .eq('student_id', profile.id)
            .maybeSingle();

        if (existing) {
            setPastSubmission(existing);
            if (state === 'history') {
                const { data: reviewData, error } = await supabase.rpc('get_quiz_review', { p_quiz_id: quiz.id });
                if (!error) setReview(reviewData);
            }
            setLoading(false);
            return;
        }

        if (state === 'live') {
            const { data, error } = await supabase.rpc('get_quiz_questions', { p_quiz_id: quiz.id });
            if (error) Alert.alert('Could not load quiz', error.message);
            else setQuestions(data);
        }
        setLoading(false);
    };

    const selectAnswer = (questionId, index) => {
        setAnswers((a) => ({ ...a, [questionId]: index }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            Alert.alert('Answer everything', 'Please answer every question before submitting.');
            return;
        }
        setSubmitting(true);
        const payload = questions.map((q) => ({ question_id: q.id, selected_option_index: answers[q.id] }));
        const { data, error } = await supabase.rpc('submit_quiz', { p_quiz_id: quiz.id, p_answers: payload });
        setSubmitting(false);
        if (error) {
            Alert.alert('Could not submit', error.message);
            return;
        }
        const result = data[0];
        Alert.alert('Quiz submitted', `You scored ${result.score} / ${result.total_questions}`, [
            { text: 'OK', onPress: () => navigation.goBack() },
        ]);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }

    // closed + submitted: full review with correct vs. selected
    if (pastSubmission && state === 'history' && review) {
        return (
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.scoreBanner}>
                    <Text style={styles.scoreText}>{pastSubmission.score} / {pastSubmission.total_questions}</Text>
                    <Text style={styles.scoreSubtext}>Final score</Text>
                </View>
                {review.map((q, qi) => (
                    <View key={qi} style={styles.questionCard}>
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
                                    {isCorrect && <Text style={styles.reviewTag}>Correct</Text>}
                                    {isSelected && !isCorrect && <Text style={styles.reviewTagWrong}>Your answer</Text>}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>
        );
    }

    // submitted but still live, or closed with no review loaded yet
    if (pastSubmission) {
        return (
            <View style={styles.centered}>
                <Text style={styles.scoreText}>{pastSubmission.score} / {pastSubmission.total_questions}</Text>
                <Text style={styles.scoreSubtext}>
                    {state === 'live' ? 'You already submitted. Answers reveal once the quiz closes.' : 'Final score'}
                </Text>
            </View>
        );
    }

    // window closed, never attempted
    if (state !== 'live') {
        return (
            <View style={styles.centered}>
                <Text style={styles.scoreSubtext}>
                    {state === 'upcoming' ? 'This quiz hasn\u2019t opened yet.' : 'This quiz is closed. You didn\u2019t submit an attempt.'}
                </Text>
            </View>
        );
    }

    // live, not yet submitted
    return (
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
                onPress={handleSubmit}
                disabled={submitting}
            >
                <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit Quiz'}</Text>
            </Pressable>
        </ScrollView>
    );
}

export default function QuizDetailScreen({ route, navigation }) {
    const { quiz } = route.params;
    const { profile } = useUser();
    const isTeacher = profile?.role === 'teacher';

    return (
        <SafeAreaView style={styles.container}>
            <Header title={quiz.title} onBack={() => navigation.goBack()} />
            {isTeacher ? (
                <TeacherView quiz={quiz} />
            ) : (
                <StudentView quiz={quiz} profile={profile} navigation={navigation} />
            )}
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
    sectionTitle: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md, marginTop: spacing.sm },
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
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, marginRight: spacing.sm },
    dotCorrect: { backgroundColor: colors.success },
    optionText: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
    optionTextCorrect: { color: colors.success, fontWeight: '600' },
    submitButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
    submitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
    scoreBanner: { alignItems: 'center', marginBottom: spacing.lg },
    scoreText: { fontSize: 48, fontWeight: '700', color: colors.accent, marginBottom: spacing.sm },
    scoreSubtext: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
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
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.xs,
        ...shadow.card,
    },
    resultName: { ...typography.body, color: colors.textPrimary },
    resultScore: { ...typography.body, color: colors.textSecondary, fontWeight: '600' },
    emptyText: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
});