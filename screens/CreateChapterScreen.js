import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, typography } from '../theme/theme';

export default function CreateChapterScreen({ navigation, route }) {
    const { t } = useLanguage();
    const editingChapter = route.params?.chapter || null;
    const isEditing = !!editingChapter;
    const subjectId = route.params.subjectId;

    const [title, setTitle] = useState(editingChapter?.title || '');
    const [mcqPdfUrl, setMcqPdfUrl] = useState(editingChapter?.mcq_pdf_url || '');
    const [saving, setSaving] = useState(false);

    const validate = () => {
        if (!title.trim()) return t('giveChapterTitle');
        return null;
    };

    const handleSave = async () => {
        const error = validate();
        if (error) {
            Alert.alert(t('missingInfo'), error);
            return;
        }

        setSaving(true);

        const pdfValue = mcqPdfUrl.trim() || null;

        if (isEditing) {
            const { error: updateError } = await supabase
                .from('chapters')
                .update({
                    title: title.trim(),
                    mcq_pdf_url: pdfValue,
                })
                .eq('id', editingChapter.id);

            setSaving(false);
            if (updateError) {
                Alert.alert(t('couldNotSave'), updateError.message);
                return;
            }
        } else {
            const { data: existing } = await supabase
                .from('chapters')
                .select('order_index')
                .eq('subject_id', subjectId)
                .order('order_index', { ascending: false })
                .limit(1);

            const nextOrderIndex = existing?.length ? existing[0].order_index + 1 : 0;

            const { error: insertError } = await supabase.from('chapters').insert({
                subject_id: subjectId,
                title: title.trim(),
                mcq_pdf_url: pdfValue,
                order_index: nextOrderIndex,
            });

            setSaving(false);
            if (insertError) {
                Alert.alert(t('couldNotCreateChapter'), insertError.message);
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
                <Text style={styles.headerTitle}>{isEditing ? t('editChapter') : t('newChapter')}</Text>
                <Pressable onPress={handleSave} disabled={saving}>
                    <Text style={[styles.saveText, saving && { opacity: 0.4 }]}>
                        {saving ? t('saving') : t('save')}
                    </Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.sectionLabel}>{t('title')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('chapterTitlePlaceholder')}
                        placeholderTextColor={colors.textTertiary}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.sectionLabel}>{t('mcqReadingPdfLinkOptional')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('mcqReadingPdfPlaceholder')}
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={mcqPdfUrl}
                        onChangeText={setMcqPdfUrl}
                    />
                    <Text style={styles.helperText}>
                        {t('mcqReadingPdfHelper')}
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
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
    headerTitle: { ...typography.headline, color: colors.textPrimary },
    cancelText: { ...typography.body, color: colors.textSecondary },
    saveText: { ...typography.body, color: colors.accent, fontWeight: '600' },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    sectionLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs, textTransform: 'uppercase' },
    input: {
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 17,
        color: colors.textPrimary,
    },
    helperText: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
});
