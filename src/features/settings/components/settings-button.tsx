"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function SettingsButton() {
    const router = useRouter();
    const { t } = useLanguage();

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/settings")}
        >
            <Settings className="h-4 w-4 mr-2" />
            {t("settings.title") || "Settings"}
        </Button>
    );
}
