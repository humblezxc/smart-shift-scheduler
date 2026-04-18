import { requireOrganization } from "@/lib/supabase-server";
import { getMonthShifts } from "@/features/scheduler/actions";
import { getEmployees } from "@/features/employees/actions";
import { MonthlyPrintView } from "@/features/scheduler/components/monthly-print-view";
import { AutoPrint } from "@/features/scheduler/components/auto-print";

export default async function PrintSchedulePage({ searchParams }: { searchParams: Promise<{ month?: string; auto?: string }> }) {
    await requireOrganization();
    const params = await searchParams;

    const baseDate = params.month ? new Date(`${params.month}-01T12:00:00`) : new Date();
    const [shifts, employees] = await Promise.all([
        getMonthShifts(baseDate),
        getEmployees({ includeArchived: true }),
    ]);

    const autoPrint = params.auto !== "0";

    return (
        <>
            <AutoPrint auto={autoPrint} />
            <MonthlyPrintView date={baseDate} employees={employees} shifts={shifts || []} />
        </>
    );
}
