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

interface Props {
    employeeId: number;
    date: Date;
}

export function RejectShiftButton({ employeeId, date }: Props) {
    const [loading, setLoading] = useState(false);

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
            toast.success("Shift rejected. Manager notified.");
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
                    Can't work
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will mark you as unavailable for this day. The manager will see this request.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleReject}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Yes, I can't work"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}