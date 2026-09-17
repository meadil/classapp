import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { bn } from '../translations/bn';
import { en } from '../translations/en';

const LANGUAGE_STORAGE_KEY = 'app_language';
const DICTIONARIES = { en, bn };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    // Bangla is the app's primary/default language
    const [language, setLanguageState] = useState('bn');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((stored) => {
            if (stored === 'en' || stored === 'bn') setLanguageState(stored);
            setLoading(false);
        });
    }, []);

    const setLanguage = async (lang) => {
        setLanguageState(lang);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    };

    // falls back to English, then to the raw key, so a missing translation
    // never renders blank while screens are converted one at a time
    const t = (key) => DICTIONARIES[language]?.[key] ?? DICTIONARIES.en[key] ?? key;

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, loading }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
