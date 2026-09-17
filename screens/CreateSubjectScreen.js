import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../components/CustomAlert';
import ClassLevelPicker from '../components/ClassLevelPicker';
import { useLanguage } from '../contexts/LanguageContext';
import { useClassLevels } from '../hooks/useClassLevels';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, typography } from '../theme/theme';

export default function CreateSubjectScreen({ navigation, route }) {
    const { t } = useLanguage();
    const alert = useAlert();
    const { classLevels } = useClassLevels();
    const editingSubject = route.params?.subject || null;
    const isEditing = !!editingSubject;

    const [name, setName] = useState(editingSubject?.name || '');
    const [icon, setIcon] = useState(editingSubject?.icon || '');
    const [classLevelId, setClassLevelId] = useState(editingSubject?.class_level_id || route.params?.classLevelId || null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!classLevelId && classLevels.length > 0) setClassLevelId(classLevels[0].id);
    }, [classLevels, classLevelId]);

    const validate = () => {
        if (!name.trim()) return t('giveSubjectName');
        if (!icon.trim()) return t('pickIcon');
        if (!classLevelId) return t('selectClassLevel');
        return null;
    };

    const handleSave = async () => {
        const error = validate();
        if (error) {
            alert(t('missingInfo'), error);
            return;
        }

        setSaving(true);

        if (isEditing) {
            const { error: updateError } = await supabase
                .from('subjects')
                .update({ name: name.trim(), icon: icon.trim(), class_level_id: classLevelId })
                .eq('id', editingSubject.id);

            setSaving(false);
            if (updateError) {
                alert(t('couldNotSave'), updateError.message);
                return;
            }
        } else {
            const { data: existing } = await supabase
                .from('subjects')
                .select('order_index')
                .eq('class_level_id', classLevelId)
                .order('order_index', { ascending: false })
                .limit(1);

            const nextOrderIndex = existing?.length ? existing[0].order_index + 1 : 0;

            const { error: insertError } = await supabase.from('subjects').insert({
                name: name.trim(),
                icon: icon.trim(),
                class_level_id: classLevelId,
                order_index: nextOrderIndex,
            });

            setSaving(false);
            if (insertError) {
                alert(t('couldNotCreateSubject'), insertError.message);
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
                <Text style={styles.headerTitle}>{isEditing ? t('editSubject') : t('newSubject')}</Text>
                <Pressable onPress={handleSave} disabled={saving}>
                    <Text style={[styles.saveText, saving && { opacity: 0.4 }]}>{saving ? t('saving') : t('save')}</Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.sectionLabel}>{t('classLevel')}</Text>
                    <ClassLevelPicker classLevels={classLevels} value={classLevelId} onChange={setClassLevelId} />

                    <Text style={styles.sectionLabel}>{t('name')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('subjectNamePlaceholder')}
                        placeholderTextColor={colors.textTertiary}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.sectionLabel}>{t('icon')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('iconPlaceholder')}
                        placeholderTextColor={colors.textTertiary}
                        value={icon}
                        onChangeText={setIcon}
                    />
                    <Text style={styles.helperText}>{t('iconHelperText')}</Text>
                </ScrollView>
            </KeyboardAvoidingView>
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
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    sectionLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs, textTransform: 'uppercase' },
    input: {
        backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
        borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 17, color: colors.textPrimary,
    },
    helperText: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
});
