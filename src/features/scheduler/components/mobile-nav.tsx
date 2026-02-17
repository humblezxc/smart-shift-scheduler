"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AddEmployeeDialog } from "@/features/employees/components/add-employee-dialog";
import { ExportMenu } from "@/features/scheduler/components/export-menu";
import { GenerateButton } from "@/features/scheduler/components/generate-button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { SettingsButton } from "@/features/settings/components/settings-button";
import { Employee } from "@/types";
import { useLanguage } from "@/context/language-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccountButton } from "@/features/account/components/account-button";

interface MobileNavProps {
    currentDate: Date;
    employees: Employee[];
    canManage?: boolean;
}

export function MobileNav({ currentDate, employees, canManage = false }: MobileNavProps) {
    const { t } = useLanguage();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                    <SheetTitle className="text-left">{t("common.menu") || "Menu"}</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <span className="text-sm font-medium text-muted-foreground">Language</span>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <LanguageSwitcher />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-muted-foreground">Actions</label>
                            <div className="flex flex-col gap-2 [&>button]:w-full [&>div]:w-full [&>form]:w-full [&>form>button]:w-full">
                                {canManage && <AddEmployeeDialog />}
                                <ExportMenu currentDate={currentDate} employees={employees} />
                                {canManage && <GenerateButton />}
                                <SettingsButton />
                                <AccountButton />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <LogoutButton />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}