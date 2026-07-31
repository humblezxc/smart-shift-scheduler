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
import { Link2, Pencil } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { ShareLinkDialog } from "./share-link-dialog";
import { resolveEmployeeColor } from "@/lib/employee-colors";

interface EmployeeListProps {
    employees: Employee[];
    canManage?: boolean;
}

export function EmployeeList({ employees, canManage = false }: EmployeeListProps) {
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [sharingEmployee, setSharingEmployee] = useState<Employee | null>(null);
    const { t } = useLanguage();

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
                                <span className="flex items-center gap-2">
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${resolveEmployeeColor(employee).dot}`}
                                    />
                                    {employee.first_name} {employee.last_name}
                                </span>
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
                                {canManage && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSharingEmployee(employee)}
                                        title={t("share.manage") !== "share.manage" ? t("share.manage") : "Manage share link"}
                                    >
                                        <Link2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
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
                    roster={employees}
                />
            )}

            {sharingEmployee && (
                <ShareLinkDialog
                    employeeId={sharingEmployee.id}
                    employeeName={`${sharingEmployee.first_name} ${sharingEmployee.last_name}`}
                    open={!!sharingEmployee}
                    onOpenChange={(open) => !open && setSharingEmployee(null)}
                />
            )}
        </div>
    );
}