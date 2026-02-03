"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { TIMEZONES, CURRENCIES, WEEK_DAYS } from "../constants";

interface GeneralSettingsSectionProps {
    orgName: string;
    setOrgName: (name: string) => void;
    timezone: string;
    setTimezone: (tz: string) => void;
    currency: string;
    setCurrency: (currency: string) => void;
    weekStartsOn: number;
    setWeekStartsOn: (day: number) => void;
    onSave: () => void;
    isPending: boolean;
}

export function GeneralSettingsSection({
    orgName,
    setOrgName,
    timezone,
    setTimezone,
    currency,
    setCurrency,
    weekStartsOn,
    setWeekStartsOn,
    onSave,
    isPending,
}: GeneralSettingsSectionProps) {
    const { t } = useLanguage();

    return (
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

                <Button onClick={onSave} disabled={isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {t("settings.save") || "Save Changes"}
                </Button>
            </CardContent>
        </Card>
    );
}
