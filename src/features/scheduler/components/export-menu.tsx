"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { getMonthShifts } from "@/features/scheduler/actions";
import { Employee, Shift } from "@/types";
import { useLanguage } from "@/context/language-context";
import { MonthlyPrintView } from "./monthly-print-view";
import { IndividualTimesheetView } from "./individual-timesheet-view";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
    currentDate: Date;
    employees: Employee[];
}

type ExportType = 'schedule' | 'timesheets' | null;

export function ExportMenu({ currentDate, employees }: Props) {
    const [loading, setLoading] = useState(false);
    const [exportType, setExportType] = useState<ExportType>(null);
    const [shifts, setShifts] = useState<Shift[]>([]);

    const scheduleRef = useRef<HTMLDivElement>(null);
    const timesheetsRef = useRef<HTMLDivElement>(null);

    const { t } = useLanguage();

    const printSchedule = useReactToPrint({
        contentRef: scheduleRef,
        documentTitle: `Schedule-${currentDate.toISOString().slice(0, 7)}`,
        onAfterPrint: () => setExportType(null),
    });

    const printTimesheets = useReactToPrint({
        contentRef: timesheetsRef,
        documentTitle: `Timesheets-${currentDate.toISOString().slice(0, 7)}`,
        onAfterPrint: () => setExportType(null),
    });

    const handleExport = async (type: ExportType) => {
        setLoading(true);
        setExportType(type);

        try {
            const data = await getMonthShifts(currentDate);
            setShifts(data || []);
            setTimeout(() => {
                if (type === 'schedule') {
                    printSchedule();
                } else if (type === 'timesheets') {
                    printTimesheets();
                }
                setLoading(false);
            }, 500);

        } catch (error) {
            toast.error("Failed to load export data");
            setLoading(false);
            setExportType(null);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={loading}>
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {t("common.export")}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('schedule')}>
                        <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-600" />
                        {t("common.export_schedule")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('timesheets')}>
                        <FileText className="mr-2 h-4 w-4 text-green-600" />
                        {t("common.export_timesheets")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden">
                {exportType === 'schedule' && shifts.length > 0 && (
                    <MonthlyPrintView
                        ref={scheduleRef}
                        date={currentDate}
                        employees={employees}
                        shifts={shifts}
                    />
                )}
                {exportType === 'timesheets' && shifts.length > 0 && (
                    <IndividualTimesheetView
                        ref={timesheetsRef}
                        date={currentDate}
                        employees={employees}
                        shifts={shifts}
                    />
                )}
            </div>
        </>
    );
}