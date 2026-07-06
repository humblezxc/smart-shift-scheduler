"use client";

import { getDayTask, DAY_TASK_EMOJI, DayTask } from "../lib/day-task";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";

const TASK_STYLES: Record<DayTask, string> = {
    pallet: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    fridge: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
};

interface Props {
    date: Date;
    variant?: "pill" | "plain";
    className?: string;
}

export function DayTaskTag({ date, variant = "pill", className }: Props) {
    const { t } = useLanguage();
    const task = getDayTask(date);
    const key = `dayTask.${task}`;
    const translated = t(key);
    const label = translated !== key ? translated : task;

    if (variant === "plain") {
        return (
            <span className={cn("inline-flex items-center gap-0.5 whitespace-nowrap", className)}>
                <span aria-hidden>{DAY_TASK_EMOJI[task]}</span>
                {label}
            </span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                TASK_STYLES[task],
                className
            )}
        >
            <span aria-hidden>{DAY_TASK_EMOJI[task]}</span>
            {label}
        </span>
    );
}

export function DayTaskLegend({ className }: { className?: string }) {
    const { t } = useLanguage();
    return (
        <div className={cn("flex items-center gap-3", className)}>
            {(Object.keys(DAY_TASK_EMOJI) as DayTask[]).map((task) => {
                const key = `dayTask.${task}`;
                const translated = t(key);
                return (
                    <span key={task} className="inline-flex items-center gap-1">
                        <span aria-hidden>{DAY_TASK_EMOJI[task]}</span>
                        {translated !== key ? translated : task}
                    </span>
                );
            })}
        </div>
    );
}
