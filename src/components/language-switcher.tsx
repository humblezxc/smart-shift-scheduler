"use client";

import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    const labels = {
        en: "English",
        pl: "Polski",
        uk: "Українська"
    };

    const flags = {
        en: "🇺🇸",
        pl: "🇵🇱",
        uk: "🇺🇦"
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Change Language">
                    <span className="text-lg leading-none">{flags[language]}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                    <span className="mr-2">🇺🇸</span> English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("pl")}>
                    <span className="mr-2">🇵🇱</span> Polski
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("uk")}>
                    <span className="mr-2">🇺🇦</span> Українська
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}