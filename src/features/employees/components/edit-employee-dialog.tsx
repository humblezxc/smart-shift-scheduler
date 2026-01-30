"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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

interface EditEmployeeDialogProps {
    employee: Employee;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditEmployeeDialog({ employee, open, onOpenChange }: EditEmployeeDialogProps) {
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

    async function onDelete() {
        setIsDeleting(true);
        const result = await deleteEmployee(employee.id);
        setIsDeleting(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(t("common.delete") || "Employee deleted");
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
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={onDelete}
                                disabled={isDeleting}
                                className="flex-1"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t("common.delete")}
                            </Button>
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
