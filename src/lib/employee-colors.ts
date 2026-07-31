export const EMPLOYEE_COLOR_SLUGS = [
    "blue",
    "rose",
    "cyan",
    "emerald",
    "amber",
    "fuchsia",
    "teal",
    "lime",
    "sky",
    "pink",
    "red",
    "green",
] as const;

export type EmployeeColor = (typeof EMPLOYEE_COLOR_SLUGS)[number];

export interface EmployeeColorClasses {
    card: string;
    accent: string;
    dot: string;
}

export const EMPLOYEE_COLOR_CLASSES: Record<EmployeeColor, EmployeeColorClasses> = {
    blue: {
        card: "bg-blue-200 text-blue-900 border-blue-300 hover:bg-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700 dark:hover:bg-blue-800",
        accent: "border-l-blue-700 dark:border-l-blue-500",
        dot: "bg-blue-700 dark:bg-blue-500",
    },
    rose: {
        card: "bg-rose-200 text-rose-900 border-rose-300 hover:bg-rose-300 dark:bg-rose-900 dark:text-rose-100 dark:border-rose-700 dark:hover:bg-rose-800",
        accent: "border-l-rose-700 dark:border-l-rose-500",
        dot: "bg-rose-700 dark:bg-rose-500",
    },
    cyan: {
        card: "bg-cyan-200 text-cyan-900 border-cyan-300 hover:bg-cyan-300 dark:bg-cyan-900 dark:text-cyan-100 dark:border-cyan-700 dark:hover:bg-cyan-800",
        accent: "border-l-cyan-600 dark:border-l-cyan-600",
        dot: "bg-cyan-600 dark:bg-cyan-600",
    },
    emerald: {
        card: "bg-emerald-200 text-emerald-900 border-emerald-300 hover:bg-emerald-300 dark:bg-emerald-900 dark:text-emerald-100 dark:border-emerald-700 dark:hover:bg-emerald-800",
        accent: "border-l-emerald-700 dark:border-l-emerald-600",
        dot: "bg-emerald-700 dark:bg-emerald-600",
    },
    amber: {
        card: "bg-amber-200 text-amber-900 border-amber-300 hover:bg-amber-300 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700 dark:hover:bg-amber-800",
        accent: "border-l-amber-700 dark:border-l-amber-600",
        dot: "bg-amber-700 dark:bg-amber-600",
    },
    fuchsia: {
        card: "bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300 hover:bg-fuchsia-300 dark:bg-fuchsia-900 dark:text-fuchsia-100 dark:border-fuchsia-700 dark:hover:bg-fuchsia-800",
        accent: "border-l-fuchsia-700 dark:border-l-fuchsia-500",
        dot: "bg-fuchsia-700 dark:bg-fuchsia-500",
    },
    teal: {
        card: "bg-teal-200 text-teal-900 border-teal-300 hover:bg-teal-300 dark:bg-teal-900 dark:text-teal-100 dark:border-teal-700 dark:hover:bg-teal-800",
        accent: "border-l-teal-600 dark:border-l-teal-600",
        dot: "bg-teal-600 dark:bg-teal-600",
    },
    lime: {
        card: "bg-lime-200 text-lime-900 border-lime-300 hover:bg-lime-300 dark:bg-lime-900 dark:text-lime-100 dark:border-lime-700 dark:hover:bg-lime-800",
        accent: "border-l-lime-700 dark:border-l-lime-600",
        dot: "bg-lime-700 dark:bg-lime-600",
    },
    sky: {
        card: "bg-sky-200 text-sky-900 border-sky-300 hover:bg-sky-300 dark:bg-sky-900 dark:text-sky-100 dark:border-sky-700 dark:hover:bg-sky-800",
        accent: "border-l-sky-700 dark:border-l-sky-600",
        dot: "bg-sky-700 dark:bg-sky-600",
    },
    pink: {
        card: "bg-pink-200 text-pink-900 border-pink-300 hover:bg-pink-300 dark:bg-pink-900 dark:text-pink-100 dark:border-pink-700 dark:hover:bg-pink-800",
        accent: "border-l-pink-700 dark:border-l-pink-500",
        dot: "bg-pink-700 dark:bg-pink-500",
    },
    red: {
        card: "bg-red-200 text-red-900 border-red-300 hover:bg-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700 dark:hover:bg-red-800",
        accent: "border-l-red-700 dark:border-l-red-500",
        dot: "bg-red-700 dark:bg-red-500",
    },
    green: {
        card: "bg-green-200 text-green-900 border-green-300 hover:bg-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700 dark:hover:bg-green-800",
        accent: "border-l-green-700 dark:border-l-green-600",
        dot: "bg-green-700 dark:bg-green-600",
    },
};

const ROLE_FALLBACK: Record<string, EmployeeColorClasses> = {
    owner: {
        card: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-950/80",
        accent: "border-l-purple-400 dark:border-l-purple-700",
        dot: "bg-purple-400 dark:bg-purple-700",
    },
    manager: {
        card: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-950/80",
        accent: "border-l-amber-400 dark:border-l-amber-700",
        dot: "bg-amber-400 dark:bg-amber-700",
    },
    cashier: {
        card: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-950/80",
        accent: "border-l-blue-400 dark:border-l-blue-700",
        dot: "bg-blue-400 dark:bg-blue-700",
    },
    student: {
        card: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-950/80",
        accent: "border-l-emerald-400 dark:border-l-emerald-700",
        dot: "bg-emerald-400 dark:bg-emerald-700",
    },
};

const NEUTRAL_FALLBACK: EmployeeColorClasses = {
    card: "bg-muted text-muted-foreground border-border hover:bg-accent",
    accent: "border-l-muted-foreground",
    dot: "bg-muted-foreground",
};

export function isEmployeeColor(value: unknown): value is EmployeeColor {
    return typeof value === "string" && (EMPLOYEE_COLOR_SLUGS as readonly string[]).includes(value);
}

export function resolveEmployeeColor(source: {
    color?: string | null;
    role?: string | null;
}): EmployeeColorClasses {
    if (isEmployeeColor(source.color)) {
        return EMPLOYEE_COLOR_CLASSES[source.color];
    }
    if (source.role && ROLE_FALLBACK[source.role]) {
        return ROLE_FALLBACK[source.role];
    }
    return NEUTRAL_FALLBACK;
}

export function nextAvailableColor(taken: readonly (string | null | undefined)[]): EmployeeColor {
    const used = new Set(taken.filter(isEmployeeColor));
    const free = EMPLOYEE_COLOR_SLUGS.find((slug) => !used.has(slug));
    return free ?? EMPLOYEE_COLOR_SLUGS[taken.length % EMPLOYEE_COLOR_SLUGS.length];
}
