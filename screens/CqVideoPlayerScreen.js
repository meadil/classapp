import { useCallback, useRef } from 'react';
import { Dimensions, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { extractYoutubeId } from '../lib/youtube';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

const PLAYER_HEIGHT = Math.round((Dimensions.get('window').width * 9) / 16);

export default function CqVideoPlayerScreen({ route, navigation }) {
    const { t } = useLanguage();
    const { video } = route.params;
    const { profile } = useUser();
    const youtubeId = extractYoutubeId(video.youtube_url);
    const hasMarkedWatched = useRef(false);

    const handleStateChange = useCallback(
        (state) => {
            if (state === 'ended' && !hasMarkedWatched.current) {
                hasMarkedWatched.current = true;
                // duplicate inserts (already watched before) fail silently on the unique constraint — that's fine
                supabase.from('cq_video_views').insert({ video_id: video.id, student_id: profile.id }).then(() => { });
            }
        },
        [video.id, profile.id]
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>{t('back')}</Text>
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{video.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {youtubeId ? (
                    <YoutubePlayer height={PLAYER_HEIGHT} videoId={youtubeId} onChangeState={handleStateChange} />
                ) : (
                    <View style={[styles.playerFallback, { height: PLAYER_HEIGHT }]}>
                        <Text style={styles.emptyText}>{t('couldNotLoadVideo')}</Text>
                    </View>
                )}

                <View style={styles.infoBlock}>
                    <Text style={styles.videoTitle}>{video.title}</Text>
                </View>

                {video.pdf_url && (
                    <Pressable style={styles.pdfButton} onPress={() => Linking.openURL(video.pdf_url)}>
                        <Text style={styles.pdfButtonText}>{t('openAttachedPdf')}</Text>
                    </Pressable>
                )}
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
    videoTitle: { ...typography.title, color: colors.textPrimary },
    pdfButton: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        marginHorizontal: spacing.lg,
        padding: spacing.md,
        alignItems: 'center',
        ...shadow.card,
    },
    pdfButtonText: { ...typography.body, color: colors.accent, fontWeight: '600' },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
