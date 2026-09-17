import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
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

export default function McqChapterScreen({ navigation, route }) {
    const { t } = useLanguage();
    const { chapter } = route.params;
    const { profile } = useUser();

    const [extraVideos, setExtraVideos] = useState([]);
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const [{ data: videosData }, { data: decksData }] = await Promise.all([
            supabase.from('mcq_extra_videos').select('*').eq('chapter_id', chapter.id).order('order_index', { ascending: true }),
            supabase.from('mcq_decks').select('*').eq('chapter_id', chapter.id).order('order_index', { ascending: true }),
        ]);
        setExtraVideos(videosData || []);
        setDecks(decksData || []);
        setLoading(false);
    }, [chapter.id]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const handleDeckPress = async (deck) => {
        const { data: existingAttempt } = await supabase
            .from('mcq_deck_attempts')
            .select('id')
            .eq('deck_id', deck.id)
            .eq('student_id', profile.id)
            .limit(1)
            .maybeSingle();

        if (existingAttempt) {
            navigation.navigate('McqDeckResults', { deck });
        } else {
            navigation.navigate('McqDeckTaking', { deck });
        }
    };

    if (loading) {
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
                    <Text style={styles.backText}>{t('back')}</Text>
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{chapter.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={decks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                onRefresh={load}
                refreshing={loading}
                ListHeaderComponent={
                    <>
                        {chapter.mcq_pdf_url && (
                            <Pressable style={styles.pdfButton} onPress={() => Linking.openURL(chapter.mcq_pdf_url)}>
                                <Text style={styles.pdfButtonText}>{t('openReadingPdf')}</Text>
                            </Pressable>
                        )}

                        {extraVideos.length > 0 && (
                            <>
                                <Text style={styles.sectionLabel}>{t('extraVideos')}</Text>
                                {extraVideos.map((v) => (
                                    <Pressable
                                        key={v.id}
                                        style={({ pressed }) => [styles.videoCard, pressed && { opacity: 0.7 }]}
                                        onPress={() => navigation.navigate('McqExtraVideoPlayer', { video: v })}
                                    >
                                        <Thumbnail url={v.youtube_url} />
                                        <View style={styles.videoBody}>
                                            <Text style={styles.videoTitle} numberOfLines={2}>{v.title}</Text>
                                            {!!v.description && (
                                                <Text style={styles.videoDescription} numberOfLines={3}>{v.description}</Text>
                                            )}
                                        </View>
                                    </Pressable>
                                ))}
                            </>
                        )}

                        {decks.length > 0 && <Text style={styles.sectionLabel}>{t('practiceDecks')}</Text>}
                    </>
                }
                renderItem={({ item }) => (
                    <Pressable
                        style={({ pressed }) => [styles.deckCard, pressed && { opacity: 0.7 }]}
                        onPress={() => handleDeckPress(item)}
                    >
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.cardSubtitle}>{item.minutes_per_question} {t('minPerQuestion')}</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </Pressable>
                )}
                ListEmptyComponent={
                    !chapter.mcq_pdf_url && extraVideos.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>{t('nothingHereYet')}</Text>
                        </View>
                    ) : null
                }
            />
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
    backText: { ...typography.body, color: colors.accent },
    headerTitle: { ...typography.headline, color: colors.textPrimary, flexShrink: 1, textAlign: 'center' },
    listContent: { padding: spacing.lg },
    pdfButton: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        alignItems: 'center',
        marginBottom: spacing.md,
        ...shadow.card,
    },
    pdfButtonText: { ...typography.body, color: colors.accent, fontWeight: '600' },
    sectionLabel: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: spacing.xs, marginTop: spacing.sm },
    videoCard: {
        backgroundColor: colors.surface, borderRadius: radius.lg,
        marginBottom: spacing.lg, overflow: 'hidden', ...shadow.card,
    },
    thumbnail: { width: CARD_WIDTH, height: THUMB_HEIGHT, backgroundColor: colors.backgroundMuted },
    videoBody: { padding: spacing.md },
    videoTitle: { ...typography.headline, color: colors.textPrimary },
    videoDescription: { ...typography.subhead, color: colors.textSecondary, marginTop: spacing.xs },
    deckCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadow.card,
    },
    cardBody: { flex: 1 },
    cardTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 2 },
    cardSubtitle: { ...typography.caption, color: colors.textSecondary },
    chevron: { ...typography.title, color: colors.textTertiary },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl },
    emptyTitle: { ...typography.headline, color: colors.textPrimary },
});
