"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AddEmployeeDialog } from "@/features/employees/components/add-employee-dialog";
import { ExportMenu } from "@/features/scheduler/components/export-menu";
import { GenerateButton } from "@/features/scheduler/components/generate-button";
import { Employee } from "@/types";
import { useLanguage } from "@/context/language-context";

interface MobileNavProps {
    currentDate: Date;
    employees: Employee[];
}

export function MobileNav({ currentDate, employees }: MobileNavProps) {
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
                        <span className="text-sm font-medium text-gray-500">Language</span>
                        <LanguageSwitcher />
                    </div>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-500">Actions</label>
                            <div className="flex flex-col gap-2 [&>button]:w-full [&>div]:w-full">
                                <AddEmployeeDialog />
                                <ExportMenu currentDate={currentDate} employees={employees} />
                                <GenerateButton />
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}