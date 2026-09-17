import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Handles the confirmation-email deep link (classapp://confirm?code=...).
        // Covers both cases: app already running (addEventListener) and app
        // was fully closed and just launched via the link (getInitialURL).
        const handleUrl = async (url) => {
            if (!url) return;
            try {
                await supabase.auth.exchangeCodeForSession(url);
                // no need to setSession here — onAuthStateChange below fires
                // automatically once the exchange succeeds
            } catch (e) {
                // not a valid/pending auth link (e.g. already used) — ignore
            }
        };

        Linking.getInitialURL().then(handleUrl);
        const linkingSub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            authListener.subscription.unsubscribe();
            linkingSub.remove();
        };
    }, []);

    useEffect(() => {
        if (!session) {
            setProfile(null);
            setLoading(false);
            return;
        }

        (async () => {
            // If this session just came from confirming email, apply the
            // class_level_id that was stashed at signup time.
            const pendingKey = `pending_class_level_id_${session.user.id}`;
            const pending = await AsyncStorage.getItem(pendingKey);
            if (pending) {
                await supabase.from('profiles').update({ class_level_id: pending }).eq('id', session.user.id);
                await AsyncStorage.removeItem(pendingKey);
            }

            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            setProfile(data);
            setLoading(false);
        })();
    }, [session]);

    const refreshProfile = async () => {
        if (!session) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
    };

    const signOut = () => supabase.auth.signOut();

    return (
        <UserContext.Provider value={{ session, profile, loading, signOut, refreshProfile }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);