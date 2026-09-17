import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../components/CustomAlert';
import ReorderableList from '../components/ReorderableList';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, typography } from '../theme/theme';

const ITEM_HEIGHT = 72;

export default function ClassLevelsScreen({ navigation }) {
    const { t } = useLanguage();
    const alert = useAlert();
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('class_levels').select('*').order('order_index', { ascending: true });
        if (!error) setLevels(data);
        setLoading(false);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const handleLongPress = (level) => {
        alert(level.name, undefined, [
            { text: t('edit'), onPress: () => navigation.navigate('CreateClassLevel', { level }) },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.from('class_levels').delete().eq('id', level.id);
                    if (error) {
                        alert(t('couldNotDelete'), t('classLevelInUseWarning'));
                    } else {
                        load();
                    }
                },
            },
            { text: t('cancel'), style: 'cancel' },
        ]);
    };

    const persistOrder = async (reordered) => {
        setLevels(reordered);
        const results = await Promise.all(
            reordered.map((item, index) => supabase.from('class_levels').update({ order_index: index }).eq('id', item.id))
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
                <Text style={styles.headerTitle}>{t('classLevels')}</Text>
                <Pressable onPress={() => navigation.navigate('CreateClassLevel')}>
                    <Text style={styles.addText}>{t('add')}</Text>
                </Pressable>
            </View>

            <View style={styles.listContent}>
                <ReorderableList
                    items={levels}
                    itemHeight={ITEM_HEIGHT}
                    keyExtractor={(item) => item.id}
                    onReorder={persistOrder}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyTitle}>{t('noClassLevelsYet')}</Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item, isDragging, dragHandleProps }) => (
                        <Pressable
                            style={({ pressed }) => [styles.card, isDragging && styles.cardDragging, pressed && !isDragging && { opacity: 0.7 }]}
                            onLongPress={() => handleLongPress(item)}
                        >
                            <Text style={styles.cardTitle}>{item.name}</Text>
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
    headerTitle: { ...typography.headline, color: colors.textPrimary },
    addText: { ...typography.body, color: colors.accent, fontWeight: '600' },
    listContent: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
        borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, height: ITEM_HEIGHT - spacing.md,
    },
    cardDragging: { shadowOpacity: 0.2, shadowRadius: 12 },
    cardTitle: { ...typography.headline, color: colors.textPrimary, flex: 1 },
    dragHandle: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
    dragHandleIcon: { fontSize: 18, color: colors.textTertiary },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl },
    emptyTitle: { ...typography.headline, color: colors.textPrimary },
});
