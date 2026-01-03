"use client";

import { useState } from "react";
import { createTimeOffRequest } from "@/features/scheduler/actions";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
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
import { useLanguage } from "@/context/language-context";

interface Props {
    employeeId: number;
    date: Date;
    label?: string;
}

export function RejectShiftButton({ employeeId, date, label }: Props) {
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    async function handleReject() {
        setLoading(true);
        const res = await createTimeOffRequest({
            employee_id: employeeId,
            date: date,
            reason: "Rejected assigned shift",
        });
        setLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(t("employee.shift_rejected"));
            window.location.reload();
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                >
                    <XCircle className="w-4 h-4 mr-1" />
                    {label || t("employee.reject_shift")}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("employee.confirm_reject")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t("employee.reject_desc")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t("employee.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleReject}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={loading}
                    >
                        {loading ? t("common.saving") : t("employee.confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}