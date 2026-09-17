import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useClassLevels() {
    const [classLevels, setClassLevels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.from('class_levels').select('*').order('order_index', { ascending: true }).then(({ data }) => {
            setClassLevels(data || []);
            setLoading(false);
        });
    }, []);

    return { classLevels, loading };
}
