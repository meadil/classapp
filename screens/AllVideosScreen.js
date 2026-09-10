import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme/theme';

export default function AllVideosScreen({ navigation }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
        setVideos(data || []);
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const handleLongPress = (video) => {
        Alert.alert(video.title, undefined, [
            { text: 'Edit', onPress: () => navigation.navigate('CreateVideo', { video }) },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.from('videos').delete().eq('id', video.id);
                    if (error) Alert.alert('Could not delete', error.message);
                    else load();
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>Back</Text>
                </Pressable>
                <Text style={styles.headerTitle}>All Videos</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={videos}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                onRefresh={load}
                refreshing={loading}
                renderItem={({ item }) => (
                    <Pressable
                        style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
                        onLongPress={() => handleLongPress(item)}
                    >
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.cardSubtitle}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </Pressable>
                )}
                ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No videos yet.</Text> : null}
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
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    backText: { ...typography.body, color: colors.accent },
    headerTitle: { ...typography.headline, color: colors.textPrimary },
    listContent: { padding: spacing.lg },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadow.card,
    },
    cardTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: 2 },
    cardSubtitle: { ...typography.caption, color: colors.textSecondary },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
});