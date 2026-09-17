import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../components/CustomAlert';
import ReorderableList from '../components/ReorderableList';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

const ITEM_HEIGHT = 88;

export default function McqDecksScreen({ navigation, route }) {
    const { t } = useLanguage();
    const { chapter } = route.params;
    const alert = useAlert();

    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('mcq_decks').select('*').eq('chapter_id', chapter.id).order('order_index', { ascending: true });
        if (!error) setDecks(data);
        setLoading(false);
    }, [chapter.id]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const handleLongPress = (deck) => {
        alert(deck.title, undefined, [
            { text: t('edit'), onPress: () => navigation.navigate('CreateMcqDeck', { deck, chapterId: chapter.id }) },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: () => {
                    alert(t('deleteDeck'), t('deleteDeckConfirm'), [
                        { text: t('cancel'), style: 'cancel' },
                        {
                            text: t('delete'),
                            style: 'destructive',
                            onPress: async () => {
                                const { error } = await supabase.from('mcq_decks').delete().eq('id', deck.id);
                                if (error) alert(t('couldNotDelete'), error.message);
                                else load();
                            },
                        },
                    ]);
                },
            },
            { text: t('cancel'), style: 'cancel' },
        ]);
    };

    const persistOrder = async (reordered) => {
        setDecks(reordered);
        const results = await Promise.all(
            reordered.map((item, index) => supabase.from('mcq_decks').update({ order_index: index }).eq('id', item.id))
        );
        const failed = results.find((r) => r.error);
        if (failed) {
            alert(t('couldNotReorder'), failed.error.message);
            load();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>{t('back')}</Text>
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>{t('practiceDecks')}</Text>
                <Pressable onPress={() => navigation.navigate('CreateMcqDeck', { chapterId: chapter.id })}>
                    <Text style={styles.addText}>{t('add')}</Text>
                </Pressable>
            </View>

            <View style={styles.listContent}>
                <ReorderableList
                    items={decks}
                    itemHeight={ITEM_HEIGHT}
                    keyExtractor={(item) => item.id}
                    onReorder={persistOrder}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyTitle}>{t('noDecksYet')}</Text>
                                <Text style={styles.emptySubtitle}>{t('tapAddDeck')}</Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item, isDragging, dragHandleProps }) => (
                        <Pressable
                            style={({ pressed }) => [styles.card, isDragging && styles.cardDragging, pressed && !isDragging && { opacity: 0.7 }]}
                            onLongPress={() => handleLongPress(item)}
                            onPress={() => navigation.navigate('McqDeckQuestions', { deck: item })}
                        >
                            <View style={styles.cardBody}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.cardSubtitle}>{item.minutes_per_question} {t('minPerQuestion')}</Text>
                            </View>
                            <View style={styles.dragHandle} {...dragHandleProps}>
                                <Text style={styles.dragHandleIcon}>☰</Text>
                            </View>
                        </Pressable>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    },
    backText: { ...typography.body, color: colors.accent },
    headerTitle: { ...typography.headline, color: colors.textPrimary, flexShrink: 1, textAlign: 'center' },
    addText: { ...typography.body, color: colors.accent, fontWeight: '600' },
    listContent: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
        borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, height: ITEM_HEIGHT - spacing.md, ...shadow.card,
    },
    cardDragging: { shadowOpacity: 0.2, shadowRadius: 12 },
    cardBody: { flex: 1 },
    cardTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 2 },
    cardSubtitle: { ...typography.caption, color: colors.textSecondary },
    dragHandle: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
    dragHandleIcon: { fontSize: 18, color: colors.textTertiary },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
    emptyTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.xs },
    emptySubtitle: { ...typography.subhead, color: colors.textSecondary, textAlign: 'center' },
});