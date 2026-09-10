import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { extractYoutubeId } from '../lib/youtube';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

const PLAYER_HEIGHT = Math.round((Dimensions.get('window').width * 9) / 16);

function timeAgo(dateString) {
    const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function VideoDetailScreen({ route, navigation }) {
    const { video } = route.params;
    const { profile } = useUser();
    const youtubeId = extractYoutubeId(video.youtube_url);

    const [questions, setQuestions] = useState([]);
    const [sortMode, setSortMode] = useState('latest'); // 'latest' | 'top'
    const [newQuestion, setNewQuestion] = useState('');
    const [posting, setPosting] = useState(false);
    const hasMarkedWatched = useRef(false);

    const loadQuestions = useCallback(async () => {
        const { data: qData } = await supabase
            .from('video_questions')
            .select('*, profiles(name), likes:video_question_likes(count)')
            .eq('video_id', video.id);

        const { data: myLikes } = await supabase
            .from('video_question_likes')
            .select('question_id')
            .eq('student_id', profile.id);

        const likedSet = new Set((myLikes || []).map((l) => l.question_id));

        const enriched = (qData || []).map((q) => ({
            ...q,
            likeCount: q.likes?.[0]?.count || 0,
            liked: likedSet.has(q.id),
        }));

        setQuestions(enriched);
    }, [video.id, profile.id]);

    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);

    const handleStateChange = useCallback(
        (state) => {
            if (state === 'ended' && !hasMarkedWatched.current) {
                hasMarkedWatched.current = true;
                // duplicate inserts (already watched before) fail silently on the unique constraint — that's fine
                supabase.from('video_views').insert({ video_id: video.id, student_id: profile.id }).then(() => { });
            }
        },
        [video.id, profile.id]
    );

    const toggleLike = async (question) => {
        // optimistic UI update, then sync to the database
        setQuestions((qs) =>
            qs.map((q) =>
                q.id === question.id ? { ...q, liked: !q.liked, likeCount: q.likeCount + (q.liked ? -1 : 1) } : q
            )
        );
        if (question.liked) {
            await supabase.from('video_question_likes').delete().eq('question_id', question.id).eq('student_id', profile.id);
        } else {
            await supabase.from('video_question_likes').insert({ question_id: question.id, student_id: profile.id });
        }
    };

    const submitQuestion = async () => {
        if (!newQuestion.trim()) return;
        setPosting(true);
        const { error } = await supabase.from('video_questions').insert({
            video_id: video.id,
            student_id: profile.id,
            question_text: newQuestion.trim(),
        });
        setPosting(false);
        if (!error) {
            setNewQuestion('');
            loadQuestions();
        }
    };

    const sortedQuestions = [...questions].sort((a, b) => {
        if (sortMode === 'top' && b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>Back</Text>
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{video.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {youtubeId ? (
                    <YoutubePlayer height={PLAYER_HEIGHT} videoId={youtubeId} onChangeState={handleStateChange} />
                ) : (
                    <View style={[styles.playerFallback, { height: PLAYER_HEIGHT }]}>
                        <Text style={styles.emptyText}>Couldn't load this video.</Text>
                    </View>
                )}

                <View style={styles.infoBlock}>
                    <Text style={styles.videoTitle}>{video.title}</Text>
                    {!!video.description && <Text style={styles.videoDescription}>{video.description}</Text>}
                </View>

                <View style={styles.divider} />

                <View style={styles.qaHeader}>
                    <Text style={styles.sectionTitle}>Questions</Text>
                    <View style={styles.sortRow}>
                        <Pressable onPress={() => setSortMode('latest')}>
                            <Text style={[styles.sortText, sortMode === 'latest' && styles.sortTextActive]}>Latest</Text>
                        </Pressable>
                        <Text style={styles.sortDivider}>·</Text>
                        <Pressable onPress={() => setSortMode('top')}>
                            <Text style={[styles.sortText, sortMode === 'top' && styles.sortTextActive]}>Top</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.askRow}>
                    <TextInput
                        style={styles.askInput}
                        placeholder="Ask a question about this video…"
                        placeholderTextColor={colors.textTertiary}
                        value={newQuestion}
                        onChangeText={setNewQuestion}
                        multiline
                    />
                    <Pressable style={styles.askButton} onPress={submitQuestion} disabled={posting}>
                        <Text style={styles.askButtonText}>{posting ? '…' : 'Ask'}</Text>
                    </Pressable>
                </View>

                {sortedQuestions.length === 0 && (
                    <Text style={styles.emptyText}>No questions yet — be the first to ask.</Text>
                )}

                {sortedQuestions.map((q) => (
                    <View key={q.id} style={styles.questionCard}>
                        <View style={styles.questionTopRow}>
                            <Text style={styles.askerName}>{q.profiles?.name || 'Student'}</Text>
                            <Text style={styles.timeText}>{timeAgo(q.created_at)}</Text>
                        </View>
                        <Text style={styles.questionText}>{q.question_text}</Text>

                        {q.answer_text ? (
                            <View style={styles.answeredBox}>
                                <Text style={styles.answeredLabel}>Teacher's answer</Text>
                                <Text style={styles.answeredText}>{q.answer_text}</Text>
                            </View>
                        ) : (
                            <Text style={styles.pendingText}>Waiting for an answer</Text>
                        )}

                        <Pressable style={styles.likeRow} onPress={() => toggleLike(q)}>
                            <Text style={[styles.likeText, q.liked && styles.likeTextActive]}>
                                {q.liked ? '♥' : '♡'} {q.likeCount}
                            </Text>
                        </Pressable>
                    </View>
                ))}
            </ScrollView>
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
    headerTitle: { ...typography.headline, color: colors.textPrimary, flexShrink: 1, textAlign: 'center' },
    scroll: { paddingBottom: spacing.xxl },
    playerFallback: { backgroundColor: colors.backgroundMuted, alignItems: 'center', justifyContent: 'center' },
    infoBlock: { padding: spacing.lg },
    videoTitle: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.xs },
    videoDescription: { ...typography.body, color: colors.textSecondary },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.lg },
    qaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
    },
    sectionTitle: { ...typography.title, color: colors.textPrimary },
    sortRow: { flexDirection: 'row', alignItems: 'center' },
    sortText: { ...typography.subhead, color: colors.textTertiary, marginHorizontal: 4 },
    sortTextActive: { color: colors.accent, fontWeight: '600' },
    sortDivider: { color: colors.textTertiary },
    askRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    askInput: {
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 15,
        color: colors.textPrimary,
        minHeight: 40,
    },
    askButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    askButtonText: { color: '#FFFFFF', fontWeight: '600' },
    questionCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        ...shadow.card,
    },
    questionTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
    askerName: { ...typography.subhead, color: colors.textPrimary, fontWeight: '600' },
    timeText: { ...typography.caption, color: colors.textTertiary },
    questionText: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.sm },
    answeredBox: { backgroundColor: colors.backgroundMuted, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm },
    answeredLabel: { ...typography.caption, color: colors.success, fontWeight: '600', marginBottom: 2 },
    answeredText: { ...typography.body, color: colors.textPrimary },
    pendingText: { ...typography.caption, color: colors.textTertiary, fontStyle: 'italic', marginBottom: spacing.sm },
    likeRow: { alignSelf: 'flex-start' },
    likeText: { ...typography.subhead, color: colors.textTertiary },
    likeTextActive: { color: colors.danger, fontWeight: '600' },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.lg },
});