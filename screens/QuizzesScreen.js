import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

function getQuizState(quiz) {
  const now = new Date();
  const opens = new Date(quiz.opens_at);
  const closes = new Date(quiz.closes_at);
  if (now < opens) return 'upcoming';
  if (now < closes) return 'live';
  return 'history';
}

function EmptyState({ isTeacher }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No quizzes yet</Text>
      <Text style={styles.emptySubtitle}>
        {isTeacher
          ? 'Create this week\u2019s quiz to get started.'
          : 'Check back when your teacher posts this week\u2019s quiz.'}
      </Text>
    </View>
  );
}

function QuizCard({ item, isTeacher, onDelete, navigation }) {
  const state = getQuizState(item);
  const label = state === 'live' ? 'Live now' : state === 'upcoming' ? 'Upcoming' : 'Closed';
  const badgeStyle = state === 'live' ? styles.badgeOpen : styles.badgeClosed;
  const textStyle = state === 'live' ? styles.badgeTextOpen : styles.badgeTextClosed;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
      onLongPress={isTeacher ? () => onDelete(item) : undefined}
      onPress={() => navigation.navigate('QuizDetail', { quiz: item })}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.badge, badgeStyle]}>
          <Text style={[styles.badgeText, textStyle]}>{label}</Text>
        </View>
      </View>
      <Text style={styles.cardSubtitle}>
        {state === 'upcoming'
          ? `Opens ${new Date(item.opens_at).toLocaleString()}`
          : state === 'live'
            ? `Closes ${new Date(item.closes_at).toLocaleTimeString()}`
            : `Closed ${new Date(item.closes_at).toLocaleDateString()}`}
      </Text>
    </Pressable>
  );
}

export default function QuizzesScreen({ navigation }) {
  const { profile } = useUser();
  const isTeacher = profile?.role === 'teacher';
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQuizzes = useCallback(async () => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('opens_at', { ascending: false });
    if (!error) setQuizzes(data);
    setLoading(false);
  }, []);

  const handleLongPress = (quiz) => {
    Alert.alert(quiz.title, undefined, [
      { text: 'Edit', onPress: () => navigation.navigate('CreateQuiz', { quiz }) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('quizzes').delete().eq('id', quiz.id);
          if (error) Alert.alert('Could not delete', error.message);
          else loadQuizzes();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      loadQuizzes();
    }, [loadQuizzes])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.largeTitle}>Quizzes</Text>
        {isTeacher && (
          <Pressable
            style={({ pressed }) => [styles.newButton, pressed && { backgroundColor: colors.accentPressed }]}
            onPress={() => navigation.navigate('CreateQuiz')}
          >
            <Text style={styles.newButtonText}>New</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <QuizCard item={item} isTeacher={isTeacher} onDelete={handleLongPress} navigation={navigation} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? <EmptyState isTeacher={isTeacher} /> : null}
        onRefresh={loadQuizzes}
        refreshing={loading}
      />
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
  newButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  newButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardTitle: { ...typography.headline, color: colors.textPrimary, flexShrink: 1, marginRight: spacing.sm },
  cardSubtitle: { ...typography.caption, color: colors.textSecondary },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  badgeOpen: { backgroundColor: '#E7F6EA' },
  badgeClosed: { backgroundColor: colors.backgroundMuted },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextOpen: { color: colors.success },
  badgeTextClosed: { color: colors.textSecondary },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.xs },
  emptySubtitle: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center' },
});