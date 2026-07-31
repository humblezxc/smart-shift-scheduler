"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Archive } from "lucide-react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { employeeSchema, EmployeeFormValues } from "../schemas";
import { updateEmployee, deleteEmployee } from "../actions";
import { useLanguage } from "@/context/language-context";
import { Employee } from "@/types";
import { ColorSwatchPicker } from "./color-swatch-picker";

interface EditEmployeeDialogProps {
    employee: Employee;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roster?: Employee[];
}

export function EditEmployeeDialog({ employee, open, onOpenChange, roster }: EditEmployeeDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { t } = useLanguage();

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema) as any,
        defaultValues: {
            first_name: employee.first_name,
            last_name: employee.last_name,
            role: employee.role as any,
            max_hours_per_week: employee.max_hours_per_week,
            hourly_rate: employee.hourly_rate,
            color: employee.color ?? null,
        },
    });

    useEffect(() => {
        if (open && employee) {
            form.reset({
                first_name: employee.first_name,
                last_name: employee.last_name,
                role: employee.role as any,
                max_hours_per_week: employee.max_hours_per_week,
                hourly_rate: employee.hourly_rate,
                color: employee.color ?? null,
            });
        }
    }, [employee, open, form]);

    async function onSubmit(values: EmployeeFormValues) {
        setIsSubmitting(true);
        const result = await updateEmployee(employee.id, values);
        setIsSubmitting(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(t("common.save") || "Employee updated!");
            onOpenChange(false);
        }
    }

    async function onArchive() {
        setIsDeleting(true);
        const result = await deleteEmployee(employee.id);
        setIsDeleting(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(t("settings.archived") !== "settings.archived" ? t("settings.archived") : "Employee moved to Former Employees");
            onOpenChange(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("common.edit")} {employee.first_name} {employee.last_name}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <FormField
                            control={form.control}
                            name="first_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("forms.first_name")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="last_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("forms.last_name")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("forms.role")}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("forms.select_role")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="manager">{t("roles.manager")}</SelectItem>
                                            <SelectItem value="cashier">{t("roles.cashier")}</SelectItem>
                                            <SelectItem value="student">{t("roles.student")}</SelectItem>
                                            <SelectItem value="owner">{t("roles.owner")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("forms.color") !== "forms.color" ? t("forms.color") : "Color"}</FormLabel>
                                    <FormControl>
                                        <ColorSwatchPicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            roster={roster}
                                            currentEmployeeId={employee.id}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="max_hours_per_week"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("forms.max_hours")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="hourly_rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("forms.hourly_rate")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="flex flex-row justify-between items-center w-full pt-4 gap-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={isDeleting}
                                        className="flex-1 text-amber-700 hover:text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    >
                                        <Archive className="w-4 h-4 mr-2" />
                                        {t("settings.archive") !== "settings.archive" ? t("settings.archive") : "Move to Former"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            {t("settings.archiveConfirmTitle") !== "settings.archiveConfirmTitle" ? t("settings.archiveConfirmTitle") : "Archive this employee?"}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t("settings.archiveConfirmDesc") !== "settings.archiveConfirmDesc"
                                                ? t("settings.archiveConfirmDesc")
                                                : "Past shifts and statistics are preserved. They won't appear on the active roster or get auto-assigned. You can reactivate them from Settings."}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                        <AlertDialogAction onClick={onArchive} disabled={isDeleting}>
                                            {isDeleting
                                                ? (t("common.saving") || "Saving...")
                                                : (t("settings.archiveConfirm") !== "settings.archiveConfirm" ? t("settings.archiveConfirm") : "Move to Former")}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button type="submit" className="flex-1" disabled={isSubmitting}>
                                {isSubmitting ? (t("common.saving") || "Saving...") : t("forms.save_changes")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
