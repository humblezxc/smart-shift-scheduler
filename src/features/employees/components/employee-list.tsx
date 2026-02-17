"use client";

import { useState } from "react";
import { Employee } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link2, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";
import { EditEmployeeDialog } from "./edit-employee-dialog";

interface EmployeeListProps {
    employees: Employee[];
    canManage?: boolean;
}

export function EmployeeList({ employees, canManage = false }: EmployeeListProps) {
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const { t, language } = useLanguage();

    const copyLink = (token: string, id: number) => {
        const url = `${window.location.origin}/s/${token}?lang=${language}`;

        navigator.clipboard.writeText(url);
        toast.success(t("common.link_copied"));

        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const roleBadgeColors: Record<string, string> = {
        owner: "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-950/80",
        manager: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-950/80",
        cashier: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-950/80",
        student: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950/80",
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("common.employees_list")}</TableHead>
                        <TableHead>{t("common.role")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((employee) => (
                        <TableRow key={employee.id}>
                            <TableCell className="font-medium">
                                {employee.first_name} {employee.last_name}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`border-0 ${roleBadgeColors[employee.role] || "bg-muted text-muted-foreground"}`}>
                                    {employee.role}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                {canManage && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingEmployee(employee)}
                                        title={t("common.edit")}
                                    >
                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        // @ts-ignore
                                        copyLink(employee.share_token, employee.id)
                                    }
                                    title={t("common.copy_link")}
                                >
                                    {copiedId === employee.id ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Link2 className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {editingEmployee && (
                <EditEmployeeDialog
                    employee={editingEmployee}
                    open={!!editingEmployee}
                    onOpenChange={(open) => !open && setEditingEmployee(null)}
                />
            )}
        </div>
    );
}