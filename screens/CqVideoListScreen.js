import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { getYoutubeThumbnail } from '../lib/youtube';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

const CARD_WIDTH = Dimensions.get('window').width - spacing.lg * 2;
const THUMB_HEIGHT = (CARD_WIDTH * 9) / 16;

function Thumbnail({ url }) {
    const thumb = getYoutubeThumbnail(url);
    return thumb ? <Image source={{ uri: thumb }} style={styles.thumbnail} /> : <View style={styles.thumbnail} />;
}

export default function CqVideoListScreen({ navigation, route }) {
    const { t } = useLanguage();
    const { chapter } = route.params;
    const { profile } = useUser();

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const [{ data: videosData }, { data: viewsData }] = await Promise.all([
            supabase.from('cq_videos').select('*').eq('chapter_id', chapter.id).order('order_index', { ascending: true }),
            supabase.from('cq_video_views').select('video_id').eq('student_id', profile.id),
        ]);

        const watchedSet = new Set((viewsData || []).map((v) => v.video_id));
        setVideos((videosData || []).map((v) => ({ ...v, watched: watchedSet.has(v.id) })));
        setLoading(false);
    }, [chapter.id, profile.id]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>{t('back')}</Text>
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{chapter.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            ) : (
                <FlatList
                    data={videos}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={load}
                    refreshing={loading}
                    renderItem={({ item }) => (
                        <Pressable
                            style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
                            onPress={() => navigation.navigate('CqVideoPlayer', { video: item })}
                        >
                            <View style={styles.thumbnailWrap}>
                                <Thumbnail url={item.youtube_url} />
                                {item.watched && (
                                    <View style={styles.watchedBadge}>
                                        <Text style={styles.watchedBadgeText}>✓</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                                {!!item.description && (
                                    <Text style={styles.cardDescription} numberOfLines={3}>{item.description}</Text>
                                )}
                            </View>
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>{t('noVideosYet')}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    },
    backText: { ...typography.body, color: colors.accent },
    headerTitle: { ...typography.headline, color: colors.textPrimary, flexShrink: 1, textAlign: 'center' },
    listContent: { padding: spacing.lg },
    card: {
        backgroundColor: colors.surface, borderRadius: radius.lg,
        marginBottom: spacing.lg, overflow: 'hidden', ...shadow.card,
    },
    thumbnailWrap: { width: CARD_WIDTH, height: THUMB_HEIGHT },
    thumbnail: { width: '100%', height: '100%', backgroundColor: colors.backgroundMuted },
    watchedBadge: {
        position: 'absolute', top: spacing.sm, right: spacing.sm,
        backgroundColor: colors.success, width: 26, height: 26, borderRadius: 13,
        alignItems: 'center', justifyContent: 'center',
    },
    watchedBadgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    cardBody: { padding: spacing.md },
    cardTitle: { ...typography.headline, color: colors.textPrimary },
    cardDescription: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.xs },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
    emptyTitle: { ...typography.headline, color: colors.textPrimary },
});
