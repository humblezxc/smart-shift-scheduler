"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MonthlyPrintView } from "./monthly-print-view";
import { getMonthShifts } from "@/features/scheduler/actions";
import { Employee, Shift } from "@/types";
import { useLanguage } from "@/context/language-context";

interface Props {
    currentDate: Date;
    employees: Employee[];
}

export function ExportButton({ currentDate, employees }: Props) {
    const [loading, setLoading] = useState(false);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const printRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Schedule-${currentDate.toISOString().slice(0, 7)}`,
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
            toast.error("Failed to load PDF data");
            setLoading(false);
        }
    };

    return (
        <>
            <Button variant="outline" onClick={loadAndPrint} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                Export PDF
            </Button>

            <div className="hidden">
                {shifts.length > 0 && (
                    <MonthlyPrintView
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