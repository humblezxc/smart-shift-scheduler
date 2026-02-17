"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/language-context";
import { updateSettings, addShiftTemplate } from "@/features/settings/actions";
import { finishOnboarding } from "@/features/onboarding/actions";
import { createEmployee } from "@/features/employees/actions";
import type { EmployeeFormValues } from "@/features/employees/schemas";
import { Check, ChevronLeft, ChevronRight, SkipForward, Building2, Clock, Users, PartyPopper } from "lucide-react";

interface OnboardingWizardProps {
    orgName: string;
}

const STEPS = ["welcome", "settings", "templates", "employees", "done"] as const;

export function OnboardingWizard({ orgName }: OnboardingWizardProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const [timezone, setTimezone] = useState("Europe/Warsaw");
    const [currency, setCurrency] = useState("PLN");
    const [weekStartsOn, setWeekStartsOn] = useState(1);
    const [templatesAdded, setTemplatesAdded] = useState(false);
    const [employees, setEmployees] = useState<Array<{ first_name: string; last_name: string; role: string }>>([]);
    const [empFirstName, setEmpFirstName] = useState("");
    const [empLastName, setEmpLastName] = useState("");
    const [empRole, setEmpRole] = useState("cashier");

    const step = STEPS[currentStep];

    const goNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
            setError(null);
        }
    };

    const goBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setError(null);
        }
    };

    const handleSaveSettings = () => {
        setError(null);
        startTransition(async () => {
            const result = await updateSettings({ timezone, currency, week_starts_on: weekStartsOn });
            if (result.error) {
                setError(result.error);
            } else {
                goNext();
            }
        });
    };

    const handleAddDefaultTemplates = () => {
        setError(null);
        startTransition(async () => {
            const morningResult = await addShiftTemplate({
                name: t("onboarding.morningShift") || "Morning",
                start_time: "05:30",
                end_time: "14:30",
                applicable_days: ["mon", "tue", "wed", "thu", "fri", "sat"],
            });

            if (morningResult.error) {
                setError(morningResult.error);
                return;
            }

            const eveningResult = await addShiftTemplate({
                name: t("onboarding.eveningShift") || "Evening",
                start_time: "14:30",
                end_time: "23:00",
                applicable_days: ["mon", "tue", "wed", "thu", "fri", "sat"],
            });

            if (eveningResult.error) {
                setError(eveningResult.error);
                return;
            }

            setTemplatesAdded(true);
            goNext();
        });
    };

    const handleAddEmployee = () => {
        if (!empFirstName.trim() || !empLastName.trim()) return;
        setError(null);

        const data: EmployeeFormValues = {
            first_name: empFirstName.trim(),
            last_name: empLastName.trim(),
            role: empRole as "manager" | "cashier" | "student" | "owner",
            max_hours_per_week: 40,
            hourly_rate: 28.10,
        };

        startTransition(async () => {
            const result = await createEmployee(data);
            if (result.error) {
                setError(result.error);
            } else {
                setEmployees([...employees, { first_name: data.first_name, last_name: data.last_name, role: data.role }]);
                setEmpFirstName("");
                setEmpLastName("");
                setEmpRole("cashier");
            }
        });
    };

    const handleFinish = () => {
        startTransition(async () => {
            await finishOnboarding();
            router.push("/");
        });
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all ${
                                i === currentStep
                                    ? "w-8 bg-blue-600"
                                    : i < currentStep
                                        ? "w-2 bg-blue-400"
                                        : "w-2 bg-muted-foreground/30"
                            }`}
                        />
                    ))}
                </div>

                <div className="bg-card rounded-xl shadow-sm border p-6 sm:p-8">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded text-sm mb-4">
                            {error}
                        </div>
                    )}

                    {step === "welcome" && (
                        <div className="text-center space-y-4">
                            <Building2 className="h-12 w-12 text-blue-600 mx-auto" />
                            <h1 className="text-2xl font-bold text-foreground">
                                {t("onboarding.welcomeTitle") || `Welcome to ${orgName}!`}
                            </h1>
                            <p className="text-muted-foreground">
                                {t("onboarding.welcomeDesc") || "Let's set up your schedule in a few quick steps. You can always change these settings later."}
                            </p>
                            <div className="text-sm text-muted-foreground space-y-1 text-left bg-muted rounded-lg p-4">
                                <p className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {t("onboarding.step1Desc") || "Configure your timezone and preferences"}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {t("onboarding.step2Desc") || "Set up shift templates"}
                                </p>
                                <p className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    {t("onboarding.step3Desc") || "Add your employees"}
                                </p>
                            </div>
                            <Button onClick={goNext} className="w-full">
                                {t("onboarding.getStarted") || "Get Started"}
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}

                    {step === "settings" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-foreground">
                                {t("onboarding.settingsTitle") || "Organization Settings"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t("onboarding.settingsDesc") || "Configure your basic preferences."}
                            </p>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label>{t("settings.timezone") || "Timezone"}</Label>
                                    <Select value={timezone} onValueChange={setTimezone}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Europe/Warsaw">Europe/Warsaw</SelectItem>
                                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                                            <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                                            <SelectItem value="Europe/Kyiv">Europe/Kyiv</SelectItem>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label>{t("settings.currency") || "Currency"}</Label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PLN">PLN</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                            <SelectItem value="UAH">UAH</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label>{t("settings.weekStartsOn") || "Week Starts On"}</Label>
                                    <Select value={String(weekStartsOn)} onValueChange={(v) => setWeekStartsOn(Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">{t("employee.Monday") || "Monday"}</SelectItem>
                                            <SelectItem value="0">{t("employee.Sunday") || "Sunday"}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={goBack}>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    {t("onboarding.back") || "Back"}
                                </Button>
                                <Button onClick={handleSaveSettings} disabled={isPending} className="flex-1">
                                    {isPending
                                        ? t("common.saving") || "Saving..."
                                        : t("onboarding.next") || "Next"}
                                    {!isPending && <ChevronRight className="h-4 w-4 ml-2" />}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "templates" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-foreground">
                                {t("onboarding.templatesTitle") || "Shift Templates"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t("onboarding.templatesDesc") || "Set up default shift patterns. We'll create Morning (05:30-14:30) and Evening (14:30-23:00) templates for weekdays."}
                            </p>

                            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium">{t("onboarding.morningShift") || "Morning"}</span>
                                    <span className="text-muted-foreground">05:30 - 14:30</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">{t("onboarding.eveningShift") || "Evening"}</span>
                                    <span className="text-muted-foreground">14:30 - 23:00</span>
                                </div>
                                <p className="text-xs text-muted-foreground pt-1">
                                    {t("onboarding.templatesDays") || "Mon - Sat"}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={goBack}>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    {t("onboarding.back") || "Back"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={goNext}
                                >
                                    <SkipForward className="h-4 w-4 mr-2" />
                                    {t("onboarding.skip") || "Skip"}
                                </Button>
                                <Button onClick={handleAddDefaultTemplates} disabled={isPending || templatesAdded} className="flex-1">
                                    {isPending
                                        ? t("common.saving") || "Saving..."
                                        : templatesAdded
                                            ? t("onboarding.added") || "Added"
                                            : t("onboarding.addTemplates") || "Add Templates"}
                                    {!isPending && !templatesAdded && <ChevronRight className="h-4 w-4 ml-2" />}
                                    {templatesAdded && <Check className="h-4 w-4 ml-2" />}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "employees" && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-foreground">
                                {t("onboarding.employeesTitle") || "Add Employees"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t("onboarding.employeesDesc") || "Add your team members. You can always add more later."}
                            </p>

                            {employees.length > 0 && (
                                <div className="space-y-1">
                                    {employees.map((emp, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-green-50 dark:bg-green-950/50 rounded px-3 py-2 text-sm">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span className="font-medium">{emp.first_name} {emp.last_name}</span>
                                            <span className="text-muted-foreground text-xs">({emp.role})</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-3 bg-muted rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">{t("forms.first_name") || "First Name"}</Label>
                                        <Input
                                            value={empFirstName}
                                            onChange={(e) => setEmpFirstName(e.target.value)}
                                            placeholder="Anna"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">{t("forms.last_name") || "Last Name"}</Label>
                                        <Input
                                            value={empLastName}
                                            onChange={(e) => setEmpLastName(e.target.value)}
                                            placeholder="Kowalska"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{t("forms.role") || "Role"}</Label>
                                    <Select value={empRole} onValueChange={setEmpRole}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="owner">{t("roles.owner") || "Owner"}</SelectItem>
                                            <SelectItem value="manager">{t("roles.manager") || "Manager"}</SelectItem>
                                            <SelectItem value="cashier">{t("roles.cashier") || "Cashier"}</SelectItem>
                                            <SelectItem value="student">{t("roles.student") || "Student"}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={handleAddEmployee}
                                    disabled={isPending || !empFirstName.trim() || !empLastName.trim()}
                                >
                                    {isPending ? t("common.saving") || "Saving..." : t("common.add_employee") || "Add Employee"}
                                </Button>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={goBack}>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    {t("onboarding.back") || "Back"}
                                </Button>
                                {employees.length === 0 ? (
                                    <Button variant="outline" onClick={goNext} className="flex-1">
                                        <SkipForward className="h-4 w-4 mr-2" />
                                        {t("onboarding.skip") || "Skip"}
                                    </Button>
                                ) : (
                                    <Button onClick={goNext} className="flex-1">
                                        {t("onboarding.next") || "Next"}
                                        <ChevronRight className="h-4 w-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === "done" && (
                        <div className="text-center space-y-4">
                            <PartyPopper className="h-12 w-12 text-green-600 mx-auto" />
                            <h1 className="text-2xl font-bold text-foreground">
                                {t("onboarding.doneTitle") || "You're all set!"}
                            </h1>
                            <p className="text-muted-foreground">
                                {t("onboarding.doneDesc") || "Your organization is ready. Head to the dashboard to start managing schedules."}
                            </p>
                            {employees.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {t("onboarding.addedCount") || `Added ${employees.length} employee(s).`}
                                </p>
                            )}
                            <Button onClick={handleFinish} className="w-full">
                                {t("onboarding.goToDashboard") || "Go to Dashboard"}
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
