"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getMonthShifts } from "@/features/scheduler/actions";
import { Employee, Shift } from "@/types";
import { useLanguage } from "@/context/language-context";
import { IndividualTimesheetView } from "./individual-timesheet-view";

interface Props {
    currentDate: Date;
    employees: Employee[];
}

export function ExportTimesheetsButton({ currentDate, employees }: Props) {
    const [loading, setLoading] = useState(false);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const printRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Timesheets-${currentDate.toISOString().slice(0, 7)}`,
        onAfterPrint: () => setShifts([]),
    });

    const loadAndPrint = async () => {
        setLoading(true);
        try {
            const data = await getMonthShifts(currentDate);
            setShifts(data || []);

            setTimeout(() => {
                handlePrint();
                setLoading(false);
            }, 500);

        } catch (error) {
            toast.error("Failed to load data");
            setLoading(false);
        }
    };

    return (
        <>
            <Button variant="outline" onClick={loadAndPrint} disabled={loading} title="Export Individual Timesheets (A4)">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Timesheets
            </Button>

            <div className="hidden">
                {shifts.length > 0 && (
                    <IndividualTimesheetView
                        ref={printRef}
                        date={currentDate}
                        employees={employees}
                        shifts={shifts}
                    />
                )}
            </div>
        </>
    );
}