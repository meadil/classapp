import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAlert } from '../components/CustomAlert';
import ClassLevelPicker from '../components/ClassLevelPicker';
import { useLanguage } from '../contexts/LanguageContext';
import { useClassLevels } from '../hooks/useClassLevels';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, typography } from '../theme/theme';

async function setClassLevelWithRetry(userId, classLevelId, attempts = 6) {
    for (let i = 0; i < attempts; i++) {
        const { data } = await supabase.from('profiles').update({ class_level_id: classLevelId }).eq('id', userId).select();
        if (data && data.length > 0) return true;
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return false;
}

export default function AuthScreen() {
    const { t } = useLanguage();
    const alert = useAlert();
    const { classLevels } = useClassLevels();

    const [mode, setMode] = useState('signIn');
    const [name, setName] = useState('');
    const [classLevelId, setClassLevelId] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);

    const handleSubmit = async () => {
        if (mode === 'signUp' && !classLevelId) {
            alert(t('missingInfo'), t('selectClassLevel'));
            return;
        }

        setBusy(true);
        if (mode === 'signUp') {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { name }, emailRedirectTo: Linking.createURL('confirm') },
            });

            if (error) {
                alert(t('signUpFailed'), error.message);
                setBusy(false);
                return;
            }

            if (data.user && data.user.identities && data.user.identities.length === 0) {
                alert(t('signUpFailed'), t('emailAlreadyRegistered'));
                setBusy(false);
                return;
            }

            if (data.session) {
                const saved = await setClassLevelWithRetry(data.session.user.id, classLevelId);
                if (!saved) alert(t('almostDone'), t('classLevelSaveFailed'));
            } else if (data.user) {
                await AsyncStorage.setItem(`pending_class_level_id_${data.user.id}`, classLevelId);
                setMode('checkEmail');
                setBusy(false);
                return;
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) alert(t('signInFailed'), t('invalidCredentials'));
        }
        setBusy(false);
    };

    if (mode === 'checkEmail') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.form}>
                    <Text style={styles.largeTitle}>{t('checkYourEmailTitle')}</Text>
                    <Text style={[styles.subhead, { marginTop: spacing.md }]}>{t('checkYourEmailBody')}</Text>
                    <Pressable
                        style={({ pressed }) => [styles.submitButton, { marginTop: spacing.xl }, pressed && { backgroundColor: colors.accentPressed }]}
                        onPress={() => setMode('signIn')}
                    >
                        <Text style={styles.submitText}>{t('backToSignIn')}</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <View style={styles.header}>
                    <Text style={styles.largeTitle}>{mode === 'signUp' ? t('createAccount') : t('signIn')}</Text>
                </View>

                <View style={styles.form}>
                    {mode === 'signUp' && (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder={t('fullName')}
                                placeholderTextColor={colors.textTertiary}
                                value={name}
                                onChangeText={setName}
                            />
                            <Text style={styles.fieldLabel}>{t('classLevel')}</Text>
                            <View style={{ marginBottom: spacing.md }}>
                                <ClassLevelPicker classLevels={classLevels} value={classLevelId} onChange={setClassLevelId} />
                            </View>
                        </>
                    )}
                    <TextInput
                        style={styles.input}
                        placeholder={t('email')}
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={t('password')}
                        placeholderTextColor={colors.textTertiary}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Pressable
                        style={({ pressed }) => [styles.submitButton, pressed && { backgroundColor: colors.accentPressed }]}
                        onPress={handleSubmit}
                        disabled={busy}
                    >
                        <Text style={styles.submitText}>{busy ? t('pleaseWait') : mode === 'signUp' ? t('signUp') : t('signIn')}</Text>
                    </Pressable>

                    <Pressable onPress={() => setMode(mode === 'signUp' ? 'signIn' : 'signUp')}>
                        <Text style={styles.switchText}>{mode === 'signUp' ? t('alreadyHaveAccount') : t('dontHaveAccount')}</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1, justifyContent: 'center' },
    header: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
    largeTitle: { ...typography.largeTitle, color: colors.textPrimary },
    subhead: { ...typography.body, color: colors.textSecondary },
    form: { paddingHorizontal: spacing.lg },
    fieldLabel: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: spacing.xs },
    input: {
        backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
        borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.textPrimary,
        marginBottom: spacing.md, ...typography.body,
    },
    submitButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
    submitText: { ...typography.headline, color: '#FFFFFF', fontSize: 17 },
    switchText: { ...typography.subhead, color: colors.accent, textAlign: 'center', marginTop: spacing.lg },
});