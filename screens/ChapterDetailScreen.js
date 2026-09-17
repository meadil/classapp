import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

function LinkCard({ title, subtitle, onPress }) {
    return (
        <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]} onPress={onPress}>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
        </Pressable>
    );
}

export default function ChapterDetailScreen({ navigation, route }) {
    const { t } = useLanguage();
    const { chapter } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>{t('back')}</Text>
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{chapter.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionLabel}>{t('cq')}</Text>
                <LinkCard
                    title={t('cqVideos')}
                    subtitle={t('cqVideosSub')}
                    onPress={() => navigation.navigate('CqVideos', { chapter })}
                />

                <Text style={styles.sectionLabel}>{t('mcq')}</Text>
                <LinkCard
                    title={t('extraVideos')}
                    subtitle={t('extraVideosSubTeacher')}
                    onPress={() => navigation.navigate('McqExtraVideos', { chapter })}
                />
                <LinkCard
                    title={t('practiceDecks')}
                    subtitle={t('practiceDecksSubTeacher')}
                    onPress={() => navigation.navigate('McqDecks', { chapter })}
                />
                <Text style={styles.helperText}>
                    {t('chapterReadingPdfHint')}
                </Text>
            </View>
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
    content: { padding: spacing.lg },
    sectionLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    card: {
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
    helperText: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm, textAlign: 'center' },
});
