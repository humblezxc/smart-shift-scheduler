"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language } from "@/lib/translations";
import { useRouter, usePathname } from "next/navigation";

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const langParam = params.get('lang');
            if (langParam === 'pl' || langParam === 'uk') {
                setLanguageState(langParam);
            }
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);

        const params = new URLSearchParams(window.location.search);
        params.set('lang', lang);
        router.replace(`${pathname}?${params.toString()}`);
    };

    const t = (key: string) => {
        const keys = key.split(".");
        let value: any = translations[language];

        for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
                value = value[k];
            } else {
                return key;
            }
        }
        return value as string;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}