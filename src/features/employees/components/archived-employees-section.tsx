"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Undo2, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";
import { restoreEmployee } from "../actions";
import { format } from "date-fns";

interface ArchivedEmployee {
    id: number;
    first_name: string;
    last_name: string;
    role: string;
    archived_at: string | null;
}

interface Props {
    employees: ArchivedEmployee[];
    canManage: boolean;
}

export function ArchivedEmployeesSection({ employees, canManage }: Props) {
    const { t } = useLanguage();
    const [isPending, startTransition] = useTransition();

    if (!employees || employees.length === 0) {
        return (
            <Card>
                <CardHeader className="flex-row items-center gap-2 space-y-0">
                    <Archive className="w-5 h-5 text-muted-foreground" />
                    <CardTitle className="text-base">
                        {t("settings.archivedEmployees") !== "settings.archivedEmployees"
                            ? t("settings.archivedEmployees")
                            : "Archived Employees"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    {t("settings.noArchivedEmployees") !== "settings.noArchivedEmployees"
                        ? t("settings.noArchivedEmployees")
                        : "No archived employees. Removed employees preserve their historical shifts and stats."}
                </CardContent>
            </Card>
        );
    }

    const handleRestore = (id: number, name: string) => {
        startTransition(async () => {
            const res = await restoreEmployee(id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`${name} restored`);
            }
        });
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
                <Archive className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base">
                    {t("settings.archivedEmployees") !== "settings.archivedEmployees"
                        ? t("settings.archivedEmployees")
                        : "Archived Employees"}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                    {t("settings.archivedDesc") !== "settings.archivedDesc"
                        ? t("settings.archivedDesc")
                        : "Former employees keep historical shifts and stats. Restore to re-activate."}
                </p>
                {employees.map((emp) => (
                    <div
                        key={emp.id}
                        className="flex items-center justify-between p-3 rounded-md border bg-muted/30"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground truncate">
                                {emp.first_name} {emp.last_name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px] uppercase">
                                    {emp.role}
                                </Badge>
                                {emp.archived_at && (
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(emp.archived_at), "MMM d, yyyy")}
                                    </span>
                                )}
                            </div>
                        </div>
                        {canManage && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestore(emp.id, `${emp.first_name} ${emp.last_name}`)}
                                disabled={isPending}
                            >
                                <Undo2 className="w-3.5 h-3.5 mr-1.5" />
                                {t("common.restore") !== "common.restore" ? t("common.restore") : "Restore"}
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
