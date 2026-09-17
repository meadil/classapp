import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useLanguage } from '../contexts/LanguageContext';
import { extractYoutubeId } from '../lib/youtube';
import { colors, spacing, typography } from '../theme/theme';

const PLAYER_HEIGHT = Math.round((Dimensions.get('window').width * 9) / 16);

export default function McqExtraVideoPlayerScreen({ route, navigation }) {
    const { t } = useLanguage();
    const { video } = route.params;
    const youtubeId = extractYoutubeId(video.youtube_url);

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
                    <YoutubePlayer height={PLAYER_HEIGHT} videoId={youtubeId} />
                ) : (
                    <View style={[styles.playerFallback, { height: PLAYER_HEIGHT }]}>
                        <Text style={styles.emptyText}>{t('couldNotLoadVideo')}</Text>
                    </View>
                )}
                <View style={styles.infoBlock}>
                    <Text style={styles.videoTitle}>{video.title}</Text>
                </View>
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
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
