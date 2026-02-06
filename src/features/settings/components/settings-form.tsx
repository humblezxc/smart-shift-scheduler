"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { GeneralSettingsSection } from "./general-settings-section";
import { ShiftTemplatesSection } from "./shift-templates-section";
import { CustomRolesSection } from "./custom-roles-section";
import {
    OrganizationSettings,
    ShiftTemplate,
    updateOrganizationName,
    updateSettings,
    addShiftTemplate,
    deleteShiftTemplate,
    addCustomRole,
    deleteCustomRole,
} from "../actions";

interface Props {
    organization: { id: string; name: string } | null;
    settings: OrganizationSettings | null;
    teamSection?: React.ReactNode;
    canEdit?: boolean;
}

export function SettingsForm({ organization, settings, teamSection, canEdit = false }: Props) {
    const { t } = useLanguage();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [orgName, setOrgName] = useState(organization?.name || "");
    const [timezone, setTimezone] = useState(settings?.timezone || "Europe/Warsaw");
    const [currency, setCurrency] = useState(settings?.currency || "PLN");
    const [weekStartsOn, setWeekStartsOn] = useState(settings?.week_starts_on ?? 1);

    const handleSaveGeneral = () => {
        startTransition(async () => {
            if (orgName !== organization?.name) {
                await updateOrganizationName(orgName);
            }
            await updateSettings({ timezone, currency, week_starts_on: weekStartsOn });
        });
    };

    const handleAddTemplate = (template: Omit<ShiftTemplate, "id">) => {
        startTransition(async () => {
            await addShiftTemplate(template);
        });
    };

    const handleDeleteTemplate = (id: string) => {
        startTransition(async () => {
            await deleteShiftTemplate(id);
        });
    };

    const handleAddRole = (role: string) => {
        startTransition(async () => {
            await addCustomRole(role);
        });
    };

    const handleDeleteRole = (role: string) => {
        startTransition(async () => {
            await deleteCustomRole(role);
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b h-16 flex items-center px-4 sm:px-6 sticky top-0 z-20 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-800 ml-2">
                    {t("settings.title") || "Settings"}
                </h1>
            </header>

            <main className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
                <GeneralSettingsSection
                    orgName={orgName}
                    setOrgName={setOrgName}
                    timezone={timezone}
                    setTimezone={setTimezone}
                    currency={currency}
                    setCurrency={setCurrency}
                    weekStartsOn={weekStartsOn}
                    setWeekStartsOn={setWeekStartsOn}
                    onSave={handleSaveGeneral}
                    isPending={isPending}
                    canEdit={canEdit}
                />

                <ShiftTemplatesSection
                    templates={settings?.shift_templates}
                    onAdd={handleAddTemplate}
                    onDelete={handleDeleteTemplate}
                    isPending={isPending}
                    canEdit={canEdit}
                />

                <CustomRolesSection
                    customRoles={settings?.custom_roles}
                    onAdd={handleAddRole}
                    onDelete={handleDeleteRole}
                    isPending={isPending}
                    canEdit={canEdit}
                />

                {teamSection}
            </main>
        </div>
    );
}
