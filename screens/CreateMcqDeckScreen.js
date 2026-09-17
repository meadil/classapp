import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, typography } from '../theme/theme';

export default function CreateMcqDeckScreen({ navigation, route }) {
    const { t } = useLanguage();
    const editingDeck = route.params?.deck || null;
    const isEditing = !!editingDeck;
    const chapterId = route.params.chapterId;

    const [title, setTitle] = useState(editingDeck?.title || '');
    const [minutesPerQuestion, setMinutesPerQuestion] = useState(
        editingDeck ? String(editingDeck.minutes_per_question) : '1'
    );
    const [saving, setSaving] = useState(false);

    const validate = () => {
        if (!title.trim()) return t('giveDeckTitle');
        const minutes = Number(minutesPerQuestion);
        if (!minutesPerQuestion.trim() || isNaN(minutes) || minutes <= 0) {
            return t('invalidMinutesPerQuestion');
        }
        return null;
    };

    const handleSave = async () => {
        const error = validate();
        if (error) {
            Alert.alert(t('missingInfo'), error);
            return;
        }

        setSaving(true);
        const minutes = Number(minutesPerQuestion);

        if (isEditing) {
            const { error: updateError } = await supabase
                .from('mcq_decks')
                .update({
                    title: title.trim(),
                    minutes_per_question: minutes,
                })
                .eq('id', editingDeck.id);

            setSaving(false);
            if (updateError) {
                Alert.alert(t('couldNotSave'), updateError.message);
                return;
            }
        } else {
            const { data: existing } = await supabase
                .from('mcq_decks')
                .select('order_index')
                .eq('chapter_id', chapterId)
                .order('order_index', { ascending: false })
                .limit(1);

            const nextOrderIndex = existing?.length ? existing[0].order_index + 1 : 0;

            const { error: insertError } = await supabase.from('mcq_decks').insert({
                chapter_id: chapterId,
                title: title.trim(),
                minutes_per_question: minutes,
                order_index: nextOrderIndex,
            });

            setSaving(false);
            if (insertError) {
                Alert.alert(t('couldNotCreateDeck'), insertError.message);
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
                <Text style={styles.headerTitle}>{isEditing ? t('editDeck') : t('newDeck')}</Text>
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
                        placeholder={t('deckTitlePlaceholder')}
                        placeholderTextColor={colors.textTertiary}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <Text style={styles.sectionLabel}>{t('minutesPerQuestion')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="1"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="numeric"
                        value={minutesPerQuestion}
                        onChangeText={setMinutesPerQuestion}
                    />
                    <Text style={styles.helperText}>
                        {t('deckTimeHelper')}
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
