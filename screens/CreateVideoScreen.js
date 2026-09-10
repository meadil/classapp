import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, typography } from '../theme/theme';

export default function CreateVideoScreen({ navigation, route }) {
    const editingVideo = route.params?.video || null;
    const isEditing = !!editingVideo;

    const { profile } = useUser();
    const [title, setTitle] = useState(editingVideo?.title || '');
    const [description, setDescription] = useState(editingVideo?.description || '');
    const [youtubeUrl, setYoutubeUrl] = useState(editingVideo?.youtube_url || '');
    const [saving, setSaving] = useState(false);

    const validate = () => {
        if (!title.trim()) return 'Give the video a title.';
        if (!youtubeUrl.trim()) return 'Paste a YouTube link.';
        if (!/youtu\.?be/.test(youtubeUrl)) return 'That doesn\u2019t look like a YouTube link.';
        return null;
    };

    const handleSave = async () => {
        const error = validate();
        if (error) {
            Alert.alert('Missing info', error);
            return;
        }

        setSaving(true);

        if (isEditing) {
            const { error: updateError } = await supabase
                .from('videos')
                .update({
                    title: title.trim(),
                    description: description.trim(),
                    youtube_url: youtubeUrl.trim(),
                })
                .eq('id', editingVideo.id);

            setSaving(false);
            if (updateError) {
                Alert.alert('Could not save changes', updateError.message);
                return;
            }
        } else {
            const { error: insertError } = await supabase.from('videos').insert({
                title: title.trim(),
                description: description.trim(),
                youtube_url: youtubeUrl.trim(),
                uploaded_by: profile.id,
            });

            setSaving(false);
            if (insertError) {
                Alert.alert('Could not post video', insertError.message);
                return;
            }
        }

        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Text style={styles.headerTitle}>{isEditing ? 'Edit Video' : 'New Video'}</Text>
                <Pressable onPress={handleSave} disabled={saving}>
                    <Text style={[styles.saveText, saving && { opacity: 0.4 }]}>
                        {saving ? 'Saving…' : isEditing ? 'Save' : 'Post'}
                    </Text>
                </Pressable>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.sectionLabel}>Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Photosynthesis — Part 1"
                        placeholderTextColor={colors.textTertiary}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.sectionLabel}>YouTube Link</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="https://youtu.be/…"
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={youtubeUrl}
                        onChangeText={setYoutubeUrl}
                    />

                    <Text style={styles.sectionLabel}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="What's this video about?"
                        placeholderTextColor={colors.textTertiary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={5}
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
    textArea: { minHeight: 100, textAlignVertical: 'top' },
});