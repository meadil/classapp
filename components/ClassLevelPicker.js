import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

export default function ClassLevelPicker({ classLevels, value, onChange }) {
    return (
        <View style={styles.row}>
            {classLevels.map((level) => (
                <Pressable
                    key={level.id}
                    style={[styles.option, value === level.id && styles.optionActive]}
                    onPress={() => onChange(level.id)}
                >
                    <Text style={[styles.text, value === level.id && styles.textActive]}>{level.name}</Text>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', backgroundColor: colors.backgroundMuted, borderRadius: radius.md, padding: 3 },
    option: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    optionActive: { backgroundColor: colors.surface, ...shadow.card },
    text: { ...typography.subhead, color: colors.textSecondary },
    textActive: { color: colors.textPrimary, fontWeight: '600' },
});
