import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

function QuestionCard({ item, onAnswered }) {
    const [answerText, setAnswerText] = useState(item.answer_text || '');
    const [saving, setSaving] = useState(false);
    const { profile } = useUser();
    const isAnswered = !!item.answer_text;

    const handleSend = async () => {
        if (!answerText.trim()) return;
        setSaving(true);
        const { error } = await supabase
            .from('video_questions')
            .update({
                answer_text: answerText.trim(),
                answered_by: profile.id,
                answered_at: new Date().toISOString(),
            })
            .eq('id', item.id);
        setSaving(false);
        if (!error) onAnswered();
    };

    return (
        <View style={styles.card}>
            <Text style={styles.videoTitle}>{item.videos?.title || 'Unknown video'}</Text>
            <Text style={styles.questionText}>{item.question_text}</Text>

            {isAnswered ? (
                <View style={styles.answeredBox}>
                    <Text style={styles.answeredLabel}>Your answer</Text>
                    <Text style={styles.answeredText}>{item.answer_text}</Text>
                </View>
            ) : (
                <View style={styles.answerRow}>
                    <TextInput
                        style={styles.answerInput}
                        placeholder="Write an answer…"
                        placeholderTextColor={colors.textTertiary}
                        value={answerText}
                        onChangeText={setAnswerText}
                        multiline
                    />
                    <Pressable style={styles.sendButton} onPress={handleSend} disabled={saving}>
                        <Text style={styles.sendButtonText}>{saving ? '…' : 'Send'}</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

export default function AllQuestionsScreen({ navigation }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        const { data } = await supabase
            .from('video_questions')
            .select('*, videos(title)')
            .order('answer_text', { ascending: true, nullsFirst: true })
            .order('created_at', { ascending: false });
        setQuestions(data || []);
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>All Questions</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={questions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                onRefresh={load}
                refreshing={loading}
                renderItem={({ item }) => <QuestionCard item={item} onAnswered={load} />}
                ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No questions yet.</Text> : null}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
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
    headerTitle: { ...typography.headline, color: colors.textPrimary },
    listContent: { padding: spacing.lg },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadow.card,
    },
    videoTitle: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
    questionText: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.sm },
    answerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
    answerInput: {
        flex: 1,
        backgroundColor: colors.backgroundMuted,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        fontSize: 15,
        color: colors.textPrimary,
        minHeight: 40,
    },
    sendButton: {
        backgroundColor: colors.accent,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    sendButtonText: { color: '#FFFFFF', fontWeight: '600' },
    answeredBox: { backgroundColor: colors.backgroundMuted, borderRadius: radius.sm, padding: spacing.sm },
    answeredLabel: { ...typography.caption, color: colors.success, fontWeight: '600', marginBottom: 2 },
    answeredText: { ...typography.body, color: colors.textPrimary },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
});