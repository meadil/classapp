import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!session) {
            setProfile(null);
            setLoading(false);
            return;
        }
        supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => {
                setProfile(data);
                setLoading(false);
            });
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