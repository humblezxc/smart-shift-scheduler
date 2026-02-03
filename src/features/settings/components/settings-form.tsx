"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ArrowLeft, Save } from "lucide-react";
import { useLanguage } from "@/context/language-context";
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

const TIMEZONES = [
    { value: "Europe/Warsaw", label: "Europe/Warsaw (CET/CEST)" },
    { value: "Europe/London", label: "Europe/London (GMT/BST)" },
    { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
    { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST)" },
    { value: "America/New_York", label: "America/New York (EST/EDT)" },
    { value: "America/Los_Angeles", label: "America/Los Angeles (PST/PDT)" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
    { value: "UTC", label: "UTC" },
];

const CURRENCIES = [
    { value: "PLN", label: "PLN (Polish Zloty)" },
    { value: "EUR", label: "EUR (Euro)" },
    { value: "USD", label: "USD (US Dollar)" },
    { value: "GBP", label: "GBP (British Pound)" },
];

const WEEK_DAYS = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
];

const APPLICABLE_DAYS = ["weekday", "saturday", "sunday", "holiday"];

interface Props {
    organization: { id: string; name: string } | null;
    settings: OrganizationSettings | null;
}

export function SettingsForm({ organization, settings }: Props) {
    const { t } = useLanguage();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [orgName, setOrgName] = useState(organization?.name || "");
    const [timezone, setTimezone] = useState(settings?.timezone || "Europe/Warsaw");
    const [currency, setCurrency] = useState(settings?.currency || "PLN");
    const [weekStartsOn, setWeekStartsOn] = useState(settings?.week_starts_on ?? 1);

    const [newTemplate, setNewTemplate] = useState<Omit<ShiftTemplate, "id">>({
        name: "",
        start_time: "09:00",
        end_time: "17:00",
        applicable_days: ["weekday"],
    });
    const [newRole, setNewRole] = useState("");

    const handleSaveGeneral = async () => {
        startTransition(async () => {
            if (orgName !== organization?.name) {
                await updateOrganizationName(orgName);
            }
            await updateSettings({ timezone, currency, week_starts_on: weekStartsOn });
        });
    };

    const handleAddTemplate = async () => {
        if (!newTemplate.name) return;
        startTransition(async () => {
            await addShiftTemplate(newTemplate);
            setNewTemplate({
                name: "",
                start_time: "09:00",
                end_time: "17:00",
                applicable_days: ["weekday"],
            });
        });
    };

    const handleDeleteTemplate = async (id: string) => {
        startTransition(async () => {
            await deleteShiftTemplate(id);
        });
    };

    const handleAddRole = async () => {
        if (!newRole.trim()) return;
        startTransition(async () => {
            await addCustomRole(newRole.trim().toLowerCase());
            setNewRole("");
        });
    };

    const handleDeleteRole = async (role: string) => {
        startTransition(async () => {
            await deleteCustomRole(role);
        });
    };

    const toggleApplicableDay = (day: string) => {
        setNewTemplate((prev) => ({
            ...prev,
            applicable_days: prev.applicable_days.includes(day)
                ? prev.applicable_days.filter((d) => d !== day)
                : [...prev.applicable_days, day],
        }));
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
                <Card>
                    <CardHeader>
                        <CardTitle>{t("settings.general") || "General Settings"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="orgName">{t("settings.orgName") || "Organization Name"}</Label>
                                <Input
                                    id="orgName"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timezone">{t("settings.timezone") || "Timezone"}</Label>
                                <Select value={timezone} onValueChange={setTimezone}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIMEZONES.map((tz) => (
                                            <SelectItem key={tz.value} value={tz.value}>
                                                {tz.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency">{t("settings.currency") || "Currency"}</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((c) => (
                                            <SelectItem key={c.value} value={c.value}>
                                                {c.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="weekStartsOn">{t("settings.weekStartsOn") || "Week Starts On"}</Label>
                                <Select
                                    value={String(weekStartsOn)}
                                    onValueChange={(v) => setWeekStartsOn(Number(v))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {WEEK_DAYS.map((d) => (
                                            <SelectItem key={d.value} value={String(d.value)}>
                                                {d.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button onClick={handleSaveGeneral} disabled={isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {t("settings.save") || "Save Changes"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("settings.shiftTemplates") || "Shift Templates"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {settings?.shift_templates?.map((template, index) => (
                                <div
                                    key={template.id || `template-${index}`}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">{template.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {template.start_time} - {template.end_time} |{" "}
                                            {template.applicable_days?.join(", ") || "all days"}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => template.id && handleDeleteTemplate(template.id)}
                                        disabled={isPending || !template.id}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 space-y-3">
                            <p className="text-sm font-medium text-gray-700">
                                {t("settings.addTemplate") || "Add New Template"}
                            </p>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <Input
                                    placeholder={t("settings.templateName") || "Template name"}
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate((p) => ({ ...p, name: e.target.value }))}
                                />
                                <Input
                                    type="time"
                                    value={newTemplate.start_time}
                                    onChange={(e) => setNewTemplate((p) => ({ ...p, start_time: e.target.value }))}
                                />
                                <Input
                                    type="time"
                                    value={newTemplate.end_time}
                                    onChange={(e) => setNewTemplate((p) => ({ ...p, end_time: e.target.value }))}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {APPLICABLE_DAYS.map((day) => (
                                    <Button
                                        key={day}
                                        size="sm"
                                        variant={newTemplate.applicable_days.includes(day) ? "default" : "outline"}
                                        onClick={() => toggleApplicableDay(day)}
                                    >
                                        {day}
                                    </Button>
                                ))}
                            </div>
                            <Button onClick={handleAddTemplate} disabled={isPending || !newTemplate.name}>
                                <Plus className="h-4 w-4 mr-2" />
                                {t("settings.addTemplate") || "Add Template"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("settings.customRoles") || "Custom Roles"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {["owner", "manager", "cashier", "student"].map((role) => (
                                <span key={role} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                                    {t(`roles.${role}`) || role}
                                </span>
                            ))}
                            {settings?.custom_roles
                                ?.filter((role): role is string => typeof role === "string" && role.length > 0)
                                .map((role, index) => (
                                <span
                                    key={`custom-${index}-${role}`}
                                    className="px-3 py-1 bg-blue-100 rounded-full text-sm flex items-center gap-2"
                                >
                                    {role}
                                    <button
                                        onClick={() => handleDeleteRole(role)}
                                        className="text-red-500 hover:text-red-700"
                                        disabled={isPending}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                placeholder={t("settings.newRole") || "New role name"}
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
                            />
                            <Button onClick={handleAddRole} disabled={isPending || !newRole.trim()}>
                                <Plus className="h-4 w-4 mr-2" />
                                {t("common.add") || "Add"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
