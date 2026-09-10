import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { getYoutubeThumbnail } from '../lib/youtube';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

const RECENT_LIMIT = 5;
const PAGE_SIZE = 5;

function Thumbnail({ url }) {
  const thumb = getYoutubeThumbnail(url);
  return thumb ? <Image source={{ uri: thumb }} style={styles.thumbnail} /> : <View style={styles.thumbnail} />;
}

function SegmentedControl({ value, onChange, badge }) {
  return (
    <View style={styles.segmentWrap}>
      <Pressable
        style={[styles.segment, value === 'videos' && styles.segmentActive]}
        onPress={() => onChange('videos')}
      >
        <Text style={[styles.segmentText, value === 'videos' && styles.segmentTextActive]} numberOfLines={1}>
          Videos
        </Text>
      </Pressable>
      <Pressable
        style={[styles.segment, value === 'questions' && styles.segmentActive]}
        onPress={() => onChange('questions')}
      >
        <View style={styles.segmentLabelRow}>
          <Text style={[styles.segmentText, value === 'questions' && styles.segmentTextActive]} numberOfLines={1}>
            Questions
          </Text>
          {badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

function TeacherVideosView({ navigation }) {
  const [segment, setSegment] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: vData }, { data: qData }] = await Promise.all([
      supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(RECENT_LIMIT),
      supabase
        .from('video_questions')
        .select('*, videos(title)')
        .is('answer_text', null)
        .order('created_at', { ascending: false })
        .limit(RECENT_LIMIT),
    ]);
    setVideos(vData || []);
    setQuestions(qData || []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleVideoLongPress = (video) => {
    Alert.alert(video.title, undefined, [
      { text: 'Edit', onPress: () => navigation.navigate('CreateVideo', { video }) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('videos').delete().eq('id', video.id);
          if (error) Alert.alert('Could not delete', error.message);
          else load();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.largeTitle}>Videos</Text>
        {segment === 'videos' ? (
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { backgroundColor: colors.accentPressed }]}
            onPress={() => navigation.navigate('CreateVideo')}
          >
            <Text style={styles.actionButtonText}>Upload</Text>
          </Pressable>
        ) : (
          <View style={{ width: 1 }} />
        )}
      </View>

      <SegmentedControl value={segment} onChange={setSegment} badge={questions.length} />

      {segment === 'videos' ? (
        <>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('AllVideos')}>
            <Text style={styles.linkText}>All Videos</Text>
          </Pressable>
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onRefresh={load}
            refreshing={loading}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
                onLongPress={() => handleVideoLongPress(item)}
                onPress={() => navigation.navigate('VideoDetail', { video: item })}
              >
                <Thumbnail url={item.youtube_url} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No videos yet.</Text> : null}
          />
        </>
      ) : (
        <>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('AllQuestions')}>
            <Text style={styles.linkText}>All Questions</Text>
          </Pressable>
          <FlatList
            data={questions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onRefresh={load}
            refreshing={loading}
            renderItem={({ item }) => (
              <Pressable style={styles.questionPreview} onPress={() => navigation.navigate('AllQuestions')}>
                <Text style={styles.questionVideoTitle}>{item.videos?.title}</Text>
                <Text style={styles.questionText} numberOfLines={2}>{item.question_text}</Text>
              </Pressable>
            )}
            ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No unanswered questions. 🎉</Text> : null}
          />
        </>
      )}
    </>
  );
}

function StudentVideosView({ navigation }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPage = useCallback(async (pageIndex, query) => {
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let request = supabase.from('videos').select('*').order('created_at', { ascending: false }).range(from, to);
    if (query) {
      request = request.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }
    const { data } = await request;
    return data || [];
  }, []);

  const resetAndLoad = useCallback(
    async (query) => {
      setLoading(true);
      const data = await loadPage(0, query);
      setVideos(data);
      setHasMore(data.length === PAGE_SIZE);
      setLoading(false);
    },
    [loadPage]
  );

  useFocusEffect(
    useCallback(() => {
      resetAndLoad(searchQuery.trim());
    }, [])
  );

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = Math.ceil(videos.length / PAGE_SIZE);
    const data = await loadPage(nextPage, searchQuery.trim());
    setVideos((v) => [...v, ...data]);
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.largeTitle}>Videos</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search videos…"
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => resetAndLoad(searchQuery.trim())}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={() => resetAndLoad(searchQuery.trim())}
        refreshing={loading}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('VideoDetail', { video: item })}
          >
            <Thumbnail url={item.youtube_url} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              {!!item.description && (
                <Text style={styles.cardSubtitle} numberOfLines={1}>{item.description}</Text>
              )}
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ marginVertical: spacing.md }} color={colors.accent} /> : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No videos yet</Text>
              <Text style={styles.emptySubtitle}>Your teacher hasn't posted any videos yet.</Text>
            </View>
          ) : null
        }
      />
    </>
  );
}

export default function VideosScreen({ navigation }) {
  const { profile } = useUser();
  const isTeacher = profile?.role === 'teacher';

  return (
    <SafeAreaView style={styles.container}>
      {isTeacher ? <TeacherVideosView navigation={navigation} /> : <StudentVideosView navigation={navigation} />}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  largeTitle: { ...typography.largeTitle, color: colors.textPrimary },
  actionButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  searchRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  searchInput: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.textPrimary,
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  segmentActive: { backgroundColor: colors.surface, ...shadow.card },
  segmentLabelRow: { flexDirection: 'row', alignItems: 'center' },
  segmentText: { ...typography.subhead, color: colors.textSecondary },
  segmentTextActive: { color: colors.textPrimary, fontWeight: '600' },
  badge: {
    marginLeft: 6,
    backgroundColor: colors.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  linkRow: { alignItems: 'flex-end', paddingHorizontal: spacing.lg, marginBottom: spacing.xs },
  linkText: { ...typography.subhead, color: colors.accent, fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  thumbnail: { width: 96, height: 72, backgroundColor: colors.backgroundMuted },
  cardBody: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.md },
  cardTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 2 },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary },
  questionPreview: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  questionVideoTitle: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  questionText: { ...typography.body, color: colors.textPrimary },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.xs },
  emptySubtitle: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center' },
});