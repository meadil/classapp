import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [className, setClassName] = useState(profile?.class_name || '');
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const startEditing = () => {
    setName(profile.name);
    setClassName(profile.class_name);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim(), class_name: className.trim() })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    await refreshProfile();
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.largeTitle}>Profile</Text>
        {!isEditing && (
          <Pressable onPress={startEditing}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{profile.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        {!isEditing && (
          <>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.role}>{profile.role === 'teacher' ? 'Teacher' : 'Student'}</Text>
          </>
        )}
      </View>

      {isEditing ? (
        <View style={styles.editCard}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textTertiary}
          />

          <Text style={styles.fieldLabel}>Class</Text>
          <TextInput
            style={styles.input}
            value={className}
            onChangeText={setClassName}
            placeholder="Class name"
            placeholderTextColor={colors.textTertiary}
          />

          <View style={styles.editActions}>
            <Pressable style={styles.cancelButton} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.saveButton, pressed && { backgroundColor: colors.accentPressed }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Row label="Class" value={profile.class_name} />
          <View style={styles.divider} />
          <Row label="Role" value={profile.role === 'teacher' ? 'Teacher' : 'Student'} />
        </View>
      )}

      {!isEditing && (
        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.6 }]}
          onPress={signOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      )}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  largeTitle: { ...typography.largeTitle, color: colors.textPrimary },
  editText: { ...typography.body, color: colors.accent, fontWeight: '600' },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarInitial: { color: '#FFFFFF', fontSize: 28, fontWeight: '600' },
  name: { ...typography.title, color: colors.textPrimary },
  role: { ...typography.subhead, color: colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowValue: { ...typography.body, color: colors.textSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  signOutButton: { alignItems: 'center', marginTop: spacing.xl, paddingVertical: spacing.sm },
  signOutText: { ...typography.body, color: colors.danger, fontWeight: '600' },
  editCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  fieldLabel: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 17,
    color: colors.textPrimary,
  },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.lg, gap: spacing.md },
  cancelButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  cancelText: { ...typography.body, color: colors.textSecondary },
  saveButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  saveText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
});