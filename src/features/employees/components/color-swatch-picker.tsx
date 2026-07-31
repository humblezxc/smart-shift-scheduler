"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { Employee } from "@/types";
import {
    EMPLOYEE_COLOR_CLASSES,
    EMPLOYEE_COLOR_SLUGS,
    EmployeeColor,
    isEmployeeColor,
} from "@/lib/employee-colors";

interface ColorSwatchPickerProps {
    value: EmployeeColor | null | undefined;
    onChange: (value: EmployeeColor | null) => void;
    roster?: Employee[];
    currentEmployeeId?: number;
}

export function ColorSwatchPicker({ value, onChange, roster = [], currentEmployeeId }: ColorSwatchPickerProps) {
    const { t } = useLanguage();

    const takenBy = new Map<EmployeeColor, string>();
    for (const member of roster) {
        if (member.id === currentEmployeeId) continue;
        if (isEmployeeColor(member.color) && !takenBy.has(member.color)) {
            takenBy.set(member.color, member.first_name);
        }
    }

    const autoLabel = t("forms.color_auto") !== "forms.color_auto" ? t("forms.color_auto") : "Auto";

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-6 gap-2">
                {EMPLOYEE_COLOR_SLUGS.map((slug) => {
                    const owner = takenBy.get(slug);
                    const selected = value === slug;
                    const colorName = t(`colors.${slug}`) !== `colors.${slug}` ? t(`colors.${slug}`) : slug;

                    return (
                        <button
                            key={slug}
                            type="button"
                            onClick={() => onChange(slug)}
                            title={owner ? `${colorName} — ${owner}` : colorName}
                            aria-label={owner ? `${colorName} (${owner})` : colorName}
                            aria-pressed={selected}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <span
                                className={cn(
                                    "h-8 w-full rounded-md flex items-center justify-center transition-all",
                                    EMPLOYEE_COLOR_CLASSES[slug].dot,
                                    selected
                                        ? "ring-2 ring-offset-2 ring-foreground ring-offset-background"
                                        : "opacity-90 group-hover:opacity-100"
                                )}
                            >
                                {selected && <Check className="h-4 w-4 text-white" />}
                            </span>
                            <span className="text-[10px] leading-none text-muted-foreground truncate w-full text-center">
                                {owner || " "}
                            </span>
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={() => onChange(null)}
                aria-pressed={!value}
                className={cn(
                    "text-xs px-2 py-1 rounded-md border transition-colors",
                    !value
                        ? "border-foreground bg-accent text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent"
                )}
            >
                {autoLabel}
            </button>
        </div>
    );
}
