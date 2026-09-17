import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

export default function McqSubjectPickerScreen({ navigation }) {
    const { t } = useLanguage();
    const { profile } = useUser();
    const classLevelId = profile?.class_level_id;

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!classLevelId) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const { data: chaptersData } = await supabase
            .from('chapters')
            .select('subject_id, mcq_pdf_url, mcq_decks(count), mcq_extra_videos(count), subjects!inner(class_level_id)')
            .eq('subjects.class_level_id', classLevelId);

        const nonEmptySubjectIds = new Set(
            (chaptersData || [])
                .filter((c) => !!c.mcq_pdf_url || (c.mcq_decks?.[0]?.count || 0) > 0 || (c.mcq_extra_videos?.[0]?.count || 0) > 0)
                .map((c) => c.subject_id)
        );

        const { data: subjectsData } = await supabase
            .from('subjects')
            .select('*')
            .eq('class_level_id', classLevelId)
            .order('order_index', { ascending: true });

        setSubjects((subjectsData || []).filter((s) => nonEmptySubjectIds.has(s.id)));
        setLoading(false);
    }, [classLevelId]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>{t('back')}</Text>
                </Pressable>
                <Text style={styles.headerTitle}>{t('practiceDecks')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {!classLevelId ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>{t('setYourClassLevel')}</Text>
                    <Text style={styles.emptySubtitle}>{t('setClassLevelPrompt')}</Text>
                </View>
            ) : loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.accent} />
                </View>
            ) : (
                <FlatList
                    data={subjects}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={load}
                    refreshing={loading}
                    renderItem={({ item }) => (
                        <Pressable
                            style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
                            onPress={() => navigation.navigate('McqChapterList', { subject: item })}
                        >
                            <Text style={styles.cardIcon}>{item.icon}</Text>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.chevron}>›</Text>
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>{t('noSubjectsYet')}</Text>
                            <Text style={styles.emptySubtitle}>{t('noMcqContentYet')}</Text>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    backText: { ...typography.body, color: colors.accent },
    headerTitle: { ...typography.headline, color: colors.textPrimary },
    listContent: { padding: spacing.lg },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadow.card },
    cardIcon: { fontSize: 24, marginRight: spacing.md },
    cardTitle: { ...typography.headline, color: colors.textPrimary, flex: 1 },
    chevron: { ...typography.title, color: colors.textTertiary },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
    emptyTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.xs },
    emptySubtitle: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center' },
});
