import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState({ title: '', message: '', buttons: [] });
    const resolveRef = useRef(null);

    const alert = useCallback((title, message, buttons = [{ text: 'OK' }]) => {
        setConfig({ title, message, buttons });
        setVisible(true);
    }, []);

    const handlePress = (button) => {
        setVisible(false);
        // let the modal's close animation start before firing the callback,
        // matching Alert.alert's feel and avoiding state updates mid-close
        setTimeout(() => button.onPress && button.onPress(), 50);
    };

    return (
        <AlertContext.Provider value={alert}>
            {children}
            <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
                <View style={styles.backdrop}>
                    <View style={styles.card}>
                        {!!config.title && <Text style={styles.title}>{config.title}</Text>}
                        {!!config.message && <Text style={styles.message}>{config.message}</Text>}
                        <View style={styles.buttonRow}>
                            {config.buttons.map((button, i) => (
                                <Pressable
                                    key={i}
                                    style={({ pressed }) => [
                                        styles.button,
                                        i > 0 && styles.buttonBorder,
                                        pressed && styles.buttonPressed,
                                    ]}
                                    onPress={() => handlePress(button)}
                                >
                                    <Text
                                        style={[
                                            styles.buttonText,
                                            button.style === 'destructive' && styles.destructiveText,
                                            button.style === 'cancel' && styles.cancelText,
                                        ]}
                                    >
                                        {button.text}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </AlertContext.Provider>
    );
}

// Usage: const alert = useAlert(); alert(title, message, [{text, onPress, style}])
export const useAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    card: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingTop: spacing.lg,
        overflow: 'hidden',
        ...shadow.card,
    },
    title: { ...typography.headline, color: colors.textPrimary, textAlign: 'center', paddingHorizontal: spacing.lg },
    message: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
    buttonRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    button: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
    buttonBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
    buttonPressed: { backgroundColor: colors.backgroundMuted },
    buttonText: { ...typography.body, color: colors.accent, fontWeight: '600' },
    destructiveText: { color: colors.danger },
    cancelText: { color: colors.textSecondary, fontWeight: '400' },
});
