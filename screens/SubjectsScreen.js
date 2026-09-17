import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../components/CustomAlert';
import ClassLevelPicker from '../components/ClassLevelPicker';
import ReorderableList from '../components/ReorderableList';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { useClassLevels } from '../hooks/useClassLevels';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, typography } from '../theme/theme';

const ITEM_HEIGHT = 88;

export default function SubjectsScreen({ navigation }) {
    const { t } = useLanguage();
    const { profile } = useUser();
    const isTeacher = profile?.role === 'teacher';
    const alert = useAlert();
    const { classLevels } = useClassLevels();

    const [classLevelId, setClassLevelId] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!classLevelId && classLevels.length > 0) setClassLevelId(classLevels[0].id);
    }, [classLevels, classLevelId]);

    const load = useCallback(async (levelId) => {
        if (!levelId) return;
        setLoading(true);
        const { data, error } = await supabase.from('subjects').select('*').eq('class_level_id', levelId).order('order_index', { ascending: true });
        if (!error) setSubjects(data);
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { if (classLevelId) load(classLevelId); }, [load, classLevelId]));

    const handleLongPress = (subject) => {
        alert(subject.name, undefined, [
            { text: t('edit'), onPress: () => navigation.navigate('CreateSubject', { subject }) },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: () => {
                    alert(t('deleteSubject'), t('deleteSubjectConfirm'), [
                        { text: t('cancel'), style: 'cancel' },
                        {
                            text: t('delete'),
                            style: 'destructive',
                            onPress: async () => {
                                const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
                                if (error) alert(t('couldNotDelete'), error.message);
                                else load(classLevelId);
                            },
                        },
                    ]);
                },
            },
            { text: t('cancel'), style: 'cancel' },
        ]);
    };

    const persistOrder = async (reordered) => {
        setSubjects(reordered);
        const results = await Promise.all(
            reordered.map((item, index) => supabase.from('subjects').update({ order_index: index }).eq('id', item.id))
        );
        const failed = results.find((r) => r.error);
        if (failed) {
            alert(t('couldNotReorder'), failed.error.message);
            load(classLevelId);
        }
    };

    if (!isTeacher) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                {navigation.canGoBack() ? (
                    <Pressable onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>{t('back')}</Text>
                    </Pressable>
                ) : (
                    <View style={styles.backPlaceholder} />
                )}
                <Text style={styles.headerTitle}>{t('subjects')}</Text>
                <Pressable onPress={() => navigation.navigate('CreateSubject', { classLevelId })}>
                    <Text style={styles.addText}>{t('add')}</Text>
                </Pressable>
            </View>

            <View style={styles.pickerWrap}>
                <ClassLevelPicker classLevels={classLevels} value={classLevelId} onChange={setClassLevelId} />
                <Pressable onPress={() => navigation.navigate('ClassLevels')}>
                    <Text style={styles.manageLevelsText}>{t('manageClassLevels')}</Text>
                </Pressable>
            </View>

            <View style={styles.listContent}>
                <ReorderableList
                    items={subjects}
                    itemHeight={ITEM_HEIGHT}
                    keyExtractor={(item) => item.id}
                    onReorder={persistOrder}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyTitle}>{t('noSubjectsYet')}</Text>
                                <Text style={styles.emptySubtitle}>{t('tapAddSubject')}</Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item, isDragging, dragHandleProps }) => (
                        <Pressable
                            style={({ pressed }) => [styles.card, isDragging && styles.cardDragging, pressed && !isDragging && { opacity: 0.7 }]}
                            onLongPress={() => handleLongPress(item)}
                            onPress={() => navigation.navigate('Chapters', { subject: item })}
                        >
                            <Text style={styles.cardIcon}>{item.icon}</Text>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
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
    backPlaceholder: { width: 40 },
    headerTitle: { ...typography.headline, color: colors.textPrimary },
    addText: { ...typography.body, color: colors.accent, fontWeight: '600' },
    pickerWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    manageLevelsText: { ...typography.caption, color: colors.accent, textAlign: 'right', marginTop: spacing.xs },
    listContent: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
        borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, height: ITEM_HEIGHT - spacing.md,
    },
    cardDragging: { shadowOpacity: 0.2, shadowRadius: 12 },
    cardIcon: { fontSize: 24, marginRight: spacing.md },
    cardTitle: { ...typography.headline, color: colors.textPrimary, flex: 1 },
    dragHandle: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
    dragHandleIcon: { fontSize: 18, color: colors.textTertiary },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
    emptyTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.xs },
    emptySubtitle: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center' },
});