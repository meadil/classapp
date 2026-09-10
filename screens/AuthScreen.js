import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors, radius, spacing, typography } from '../theme/theme';

export default function AuthScreen() {
    const [mode, setMode] = useState('signIn'); // 'signIn' | 'signUp'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);

    const handleSubmit = async () => {
        setBusy(true);
        if (mode === 'signUp') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { name } },
            });
            if (error) Alert.alert('Sign up failed', error.message);
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) Alert.alert('Sign in failed', error.message);
        }
        setBusy(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <View style={styles.header}>
                    <Text style={styles.largeTitle}>{mode === 'signUp' ? 'Create Account' : 'Sign In'}</Text>
                </View>

                <View style={styles.form}>
                    {mode === 'signUp' && (
                        <TextInput
                            style={styles.input}
                            placeholder="Full name"
                            placeholderTextColor={colors.textTertiary}
                            value={name}
                            onChangeText={setName}
                        />
                    )}
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
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
                        <Text style={styles.submitText}>{busy ? 'Please wait…' : mode === 'signUp' ? 'Sign Up' : 'Sign In'}</Text>
                    </Pressable>

                    <Pressable onPress={() => setMode(mode === 'signUp' ? 'signIn' : 'signUp')}>
                        <Text style={styles.switchText}>
                            {mode === 'signUp' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </Text>
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
    form: { paddingHorizontal: spacing.lg },
    input: {
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: 17,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    submitButton: {
        backgroundColor: colors.accent,
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    submitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
    switchText: { color: colors.accent, textAlign: 'center', marginTop: spacing.lg, fontSize: 15 },
});