import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../components/CustomAlert';
import ClassLevelPicker from '../components/ClassLevelPicker';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { useClassLevels } from '../hooks/useClassLevels';
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
  const { t, language, setLanguage } = useLanguage();
  const alert = useAlert();
  const { classLevels } = useClassLevels();

  const isStudent = profile?.role === 'student';
  const currentLevelName = classLevels.find((l) => l.id === profile?.class_level_id)?.name;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [classLevelId, setClassLevelId] = useState(profile?.class_level_id || null);
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const startEditing = () => {
    setName(profile.name);
    setClassLevelId(profile.class_level_id);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert(t('nameRequired'), t('pleaseEnterName'));
      return;
    }
    setSaving(true);
    const updates = { name: name.trim() };
    if (isStudent) updates.class_level_id = classLevelId;

    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
    setSaving(false);
    if (error) {
      alert(t('couldNotSave'), error.message);
      return;
    }
    await refreshProfile();
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.largeTitle}>{t('profile')}</Text>
        {!isEditing && (
          <Pressable onPress={startEditing}>
            <Text style={styles.editText}>{t('edit')}</Text>
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
            <Text style={styles.role}>{profile.role === 'teacher' ? t('teacher') : t('student')}</Text>
          </>
        )}
      </View>

      {isEditing ? (
        <View style={styles.editCard}>
          <Text style={styles.fieldLabel}>{t('name')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('yourName')}
            placeholderTextColor={colors.textTertiary}
          />

          {isStudent && (
            <>
              <Text style={styles.fieldLabel}>{t('class')}</Text>
              <ClassLevelPicker classLevels={classLevels} value={classLevelId} onChange={setClassLevelId} />
            </>
          )}

          <View style={styles.editActions}>
            <Pressable style={styles.cancelButton} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.saveButton, pressed && { backgroundColor: colors.accentPressed }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? t('saving') : t('save')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          {isStudent && (
            <>
              <Row label={t('class')} value={currentLevelName || '—'} />
              <View style={styles.divider} />
            </>
          )}
          <Row label={t('role')} value={profile.role === 'teacher' ? t('teacher') : t('student')} />
        </View>
      )}

      {!isEditing && (
        <>
          <Text style={styles.sectionLabel}>{t('language')}</Text>
          <View style={styles.languageRow}>
            <Pressable
              style={[styles.languageOption, language === 'bn' && styles.languageOptionActive]}
              onPress={() => setLanguage('bn')}
            >
              <Text style={[styles.languageText, language === 'bn' && styles.languageTextActive]}>বাংলা</Text>
            </Pressable>
            <Pressable
              style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.languageText, language === 'en' && styles.languageTextActive]}>English</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.6 }]}
            onPress={signOut}
          >
            <Text style={styles.signOutText}>{t('signOut')}</Text>
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  largeTitle: { ...typography.largeTitle, color: colors.textPrimary },
  editText: { ...typography.headline, color: colors.accent, fontSize: typography.body.fontSize },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarInitial: { color: '#FFFFFF', fontSize: 28, fontFamily: typography.headline.fontFamily },
  name: { ...typography.title, color: colors.textPrimary },
  role: { ...typography.subhead, color: colors.textSecondary, marginTop: 2 },
  sectionLabel: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase', marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, marginHorizontal: spacing.lg, paddingHorizontal: spacing.md, ...shadow.card },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowValue: { ...typography.body, color: colors.textSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  languageRow: { flexDirection: 'row', backgroundColor: colors.backgroundMuted, borderRadius: radius.md, marginHorizontal: spacing.lg, padding: 3 },
  languageOption: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  languageOptionActive: { backgroundColor: colors.surface, ...shadow.card },
  languageText: { ...typography.subhead, color: colors.textSecondary },
  languageTextActive: { ...typography.headline, color: colors.textPrimary, fontSize: typography.subhead.fontSize },
  signOutButton: { alignItems: 'center', marginTop: spacing.xl, paddingVertical: spacing.sm },
  signOutText: { ...typography.headline, color: colors.danger, fontSize: typography.body.fontSize },
  editCard: { backgroundColor: colors.surface, borderRadius: radius.lg, marginHorizontal: spacing.lg, padding: spacing.md, ...shadow.card },
  fieldLabel: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: colors.backgroundMuted, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.textPrimary, ...typography.body },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.lg, gap: spacing.md },
  cancelButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  cancelText: { ...typography.body, color: colors.textSecondary },
  saveButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  saveText: { ...typography.headline, color: '#FFFFFF', fontSize: 17 },
});
