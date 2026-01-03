"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { translations, Language } from "@/lib/translations";

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en");
    const searchParams = useSearchParams();

    useEffect(() => {
        const urlLang = searchParams?.get("lang") as Language;
        if (urlLang && ["en", "pl", "uk"].includes(urlLang)) {
            setLanguageState(urlLang);
            localStorage.setItem("app-language", urlLang);
            return;
        }

        const saved = localStorage.getItem("app-language") as Language;
        if (saved && ["en", "pl", "uk"].includes(saved)) {
            setLanguageState(saved);
        }
    }, [searchParams]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("app-language", lang);
    };

    const t = (path: string) => {
        const keys = path.split(".");
        let current: any = translations[language];
        for (const key of keys) {
            if (current[key] === undefined) return path;
            current = current[key];
        }
        return current;
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