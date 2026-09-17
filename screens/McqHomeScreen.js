import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
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

export default function McqHomeScreen({ navigation }) {
    const { t } = useLanguage();
    const { profile } = useUser();
    const isTeacher = profile?.role === 'teacher';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.largeTitle}>{t('mcq')}</Text>
            </View>

            <View style={styles.content}>
                <LinkCard
                    title={t('weeklyLiveQuiz')}
                    subtitle={isTeacher ? t('createAndManageQuizzes') : t('thisWeeksScheduledQuiz')}
                    onPress={() => navigation.navigate('QuizzesList')}
                />
                <LinkCard
                    title={isTeacher ? t('manageSubjects') : t('practiceDecks')}
                    subtitle={isTeacher ? t('manageSubjectsSub') : t('practiceDecksSub')}
                    onPress={() => navigation.navigate(isTeacher ? 'Subjects' : 'McqSubjectPicker')}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
    largeTitle: { ...typography.largeTitle, color: colors.textPrimary },
    content: { paddingHorizontal: spacing.lg },
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
});
