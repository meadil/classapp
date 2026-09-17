import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../components/CustomAlert';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, typography } from '../theme/theme';

export default function CreateClassLevelScreen({ navigation, route }) {
    const { t } = useLanguage();
    const alert = useAlert();
    const editingLevel = route.params?.level || null;
    const isEditing = !!editingLevel;

    const [name, setName] = useState(editingLevel?.name || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            alert(t('missingInfo'), t('giveClassLevelName'));
            return;
        }
        setSaving(true);

        if (isEditing) {
            const { error } = await supabase.from('class_levels').update({ name: name.trim() }).eq('id', editingLevel.id);
            setSaving(false);
            if (error) {
                alert(t('couldNotSave'), error.message);
                return;
            }
        } else {
            const { data: existing } = await supabase.from('class_levels').select('order_index').order('order_index', { ascending: false }).limit(1);
            const nextOrderIndex = existing?.length ? existing[0].order_index + 1 : 0;

            const { error } = await supabase.from('class_levels').insert({ name: name.trim(), order_index: nextOrderIndex });
            setSaving(false);
            if (error) {
                alert(t('couldNotCreate'), error.message);
                return;
            }
        }

        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>{t('cancel')}</Text>
                </Pressable>
                <Text style={styles.headerTitle}>{isEditing ? t('editClassLevel') : t('newClassLevel')}</Text>
                <Pressable onPress={handleSave} disabled={saving}>
                    <Text style={[styles.saveText, saving && { opacity: 0.4 }]}>{saving ? t('saving') : t('save')}</Text>
                </Pressable>
            </View>

            <View style={styles.form}>
                <Text style={styles.sectionLabel}>{t('name')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('classLevelNamePlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    value={name}
                    onChangeText={setName}
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
    headerTitle: { ...typography.headline, color: colors.textPrimary },
    cancelText: { ...typography.body, color: colors.textSecondary },
    saveText: { ...typography.body, color: colors.accent, fontWeight: '600' },
    form: { padding: spacing.lg },
    sectionLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase' },
    input: {
        backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
        borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 17, color: colors.textPrimary,
    },
});
