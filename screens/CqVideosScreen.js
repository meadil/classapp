import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../components/CustomAlert';
import ReorderableList from '../components/ReorderableList';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { getYoutubeThumbnail } from '../lib/youtube';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

const ITEM_HEIGHT = 96;

function Thumbnail({ url }) {
    const thumb = getYoutubeThumbnail(url);
    return thumb ? <Image source={{ uri: thumb }} style={styles.thumbnail} /> : <View style={styles.thumbnail} />;
}

export default function CqVideosScreen({ navigation, route }) {
    const { t } = useLanguage();
    const { chapter } = route.params;
    const alert = useAlert();

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('cq_videos').select('*').eq('chapter_id', chapter.id).order('order_index', { ascending: true });
        if (!error) setVideos(data);
        setLoading(false);
    }, [chapter.id]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const handleLongPress = (video) => {
        alert(video.title, undefined, [
            { text: t('edit'), onPress: () => navigation.navigate('CreateCqVideo', { video, chapterId: chapter.id }) },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.from('cq_videos').delete().eq('id', video.id);
                    if (error) alert(t('couldNotDelete'), error.message);
                    else load();
                },
            },
            { text: t('cancel'), style: 'cancel' },
        ]);
    };

    const persistOrder = async (reordered) => {
        setVideos(reordered);
        const results = await Promise.all(
            reordered.map((item, index) => supabase.from('cq_videos').update({ order_index: index }).eq('id', item.id))
        );
        const failed = results.find((r) => r.error);
        if (failed) {
            alert(t('couldNotReorder'), failed.error.message);
            load();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>{t('back')}</Text>
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{chapter.title}</Text>
                <Pressable onPress={() => navigation.navigate('CreateCqVideo', { chapterId: chapter.id })}>
                    <Text style={styles.addText}>{t('add')}</Text>
                </Pressable>
            </View>

            <View style={styles.listContent}>
                <ReorderableList
                    items={videos}
                    itemHeight={ITEM_HEIGHT}
                    keyExtractor={(item) => item.id}
                    onReorder={persistOrder}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyTitle}>{t('noVideosYet')}</Text>
                                <Text style={styles.emptySubtitle}>{t('tapAddVideo')}</Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item, isDragging, dragHandleProps }) => (
                        <Pressable
                            style={({ pressed }) => [styles.card, isDragging && styles.cardDragging, pressed && !isDragging && { opacity: 0.7 }]}
                            onLongPress={() => handleLongPress(item)}
                        >
                            <Thumbnail url={item.youtube_url} />
                            <View style={styles.cardBody}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.cardSubtitle}>{item.pdf_url ? t('pdfAttached') : t('noPdfAttached')}</Text>
                            </View>
                            <View style={styles.dragHandle} {...dragHandleProps}>
                                <Text style={styles.dragHandleIcon}>☰</Text>
                            </View>
                        </Pressable>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    },
    backText: { ...typography.body, color: colors.accent },
    headerTitle: { ...typography.headline, color: colors.textPrimary, flexShrink: 1, textAlign: 'center' },
    addText: { ...typography.body, color: colors.accent, fontWeight: '600' },
    listContent: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
        borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden', height: ITEM_HEIGHT - spacing.md, ...shadow.card,
    },
    cardDragging: { shadowOpacity: 0.2, shadowRadius: 12 },
    thumbnail: { width: 96, height: '100%', backgroundColor: colors.backgroundMuted },
    cardBody: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.md },
    cardTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 2 },
    cardSubtitle: { ...typography.caption, color: colors.textSecondary },
    dragHandle: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
    dragHandleIcon: { fontSize: 18, color: colors.textTertiary },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
    emptyTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.xs },
    emptySubtitle: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center' },
});