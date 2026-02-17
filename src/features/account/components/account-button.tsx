"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function AccountButton() {
    const router = useRouter();
    const { t } = useLanguage();

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/account")}
        >
            <User className="h-4 w-4 mr-2" />
            {t("account.title") || "Account"}
        </Button>
    );
}
