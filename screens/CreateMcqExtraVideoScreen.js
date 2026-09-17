import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, typography } from '../theme/theme';

export default function CreateMcqExtraVideoScreen({ navigation, route }) {
    const { t } = useLanguage();
    const editingVideo = route.params?.video || null;
    const isEditing = !!editingVideo;
    const chapterId = route.params.chapterId;

    const [title, setTitle] = useState(editingVideo?.title || '');
    const [youtubeUrl, setYoutubeUrl] = useState(editingVideo?.youtube_url || '');
    const [description, setDescription] = useState(editingVideo?.description || '');
    const [saving, setSaving] = useState(false);

    const validate = () => {
        if (!title.trim()) return t('giveVideoTitle');
        if (!youtubeUrl.trim()) return t('pasteYoutubeLink');
        if (!/youtu\.?be/.test(youtubeUrl)) return t('invalidYoutubeLink');
        return null;
    };

    const handleSave = async () => {
        const error = validate();
        if (error) {
            Alert.alert(t('missingInfo'), error);
            return;
        }

        setSaving(true);

        if (isEditing) {
            const { error: updateError } = await supabase
                .from('mcq_extra_videos')
                .update({
                    title: title.trim(),
                    youtube_url: youtubeUrl.trim(),
                    description: description.trim() || null,
                })
                .eq('id', editingVideo.id);

            setSaving(false);
            if (updateError) {
                Alert.alert(t('couldNotSave'), updateError.message);
                return;
            }
        } else {
            const { data: existing } = await supabase
                .from('mcq_extra_videos')
                .select('order_index')
                .eq('chapter_id', chapterId)
                .order('order_index', { ascending: false })
                .limit(1);

            const nextOrderIndex = existing?.length ? existing[0].order_index + 1 : 0;

            const { error: insertError } = await supabase.from('mcq_extra_videos').insert({
                chapter_id: chapterId,
                title: title.trim(),
                youtube_url: youtubeUrl.trim(),
                description: description.trim() || null,
                order_index: nextOrderIndex,
            });

            setSaving(false);
            if (insertError) {
                Alert.alert(t('couldNotCreateVideo'), insertError.message);
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
                <Text style={styles.headerTitle}>{isEditing ? t('editVideo') : t('newExtraVideo')}</Text>
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
                        placeholder={t('extraVideoTitlePlaceholder')}
                        placeholderTextColor={colors.textTertiary}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.sectionLabel}>{t('youtubeLink')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('youtubeLinkPlaceholder')}
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={youtubeUrl}
                        onChangeText={setYoutubeUrl}
                    />

                    <Text style={styles.sectionLabel}>{t('descriptionOptional')}</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder={t('descriptionPlaceholder')}
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />
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
    textArea: { minHeight: 90, textAlignVertical: 'top', paddingTop: spacing.sm },
});
