"use client";

import { Suspense } from "react";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";

function LanguageSwitcherContent() {
    const { language, setLanguage } = useLanguage();

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

export function LanguageSwitcher() {
    return (
        <Suspense fallback={
            <Button variant="ghost" size="icon" disabled>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </Button>
        }>
            <LanguageSwitcherContent />
        </Suspense>
    );
}