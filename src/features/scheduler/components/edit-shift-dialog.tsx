"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shiftSchema, ShiftFormValues } from "../schemas";
import { updateShift, deleteShift } from "../actions";
import { Employee } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";

interface EditShiftDialogProps {
    shift: any;
    employees: Employee[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditShiftDialog({ shift, employees, open, onOpenChange }: EditShiftDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { t } = useLanguage();

    const form = useForm<ShiftFormValues>({
        resolver: zodResolver(shiftSchema) as any,
        defaultValues: {
            employee_id: shift.employee_id,
            date: new Date(shift.start_time),
            start_time: format(new Date(shift.start_time), "HH:mm"),
            end_time: format(new Date(shift.end_time), "HH:mm"),
        },
    });

    async function onSubmit(values: ShiftFormValues) {
        const res = await updateShift(shift.id, values);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Shift updated successfully");
            onOpenChange(false);
        }
    }

    async function onDelete() {
        setIsDeleting(true);
        const res = await deleteShift(shift.id);
        setIsDeleting(false);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Shift deleted");
            onOpenChange(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("common.edit")} {t("common.schedule")}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="employee_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("common.staff")}</FormLabel>
                                    <Select
                                        onValueChange={(v) => field.onChange(Number(v))}
                                        defaultValue={String(field.value)}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t("forms.select_employee")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={String(emp.id)}>
                                                    {emp.first_name} {emp.last_name} ({emp.role})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="start_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("forms.start_time")}</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="end_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("forms.end_time")}</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
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
                            <Button type="submit" className="flex-1">
                                {t("forms.save_changes")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}