import { getShiftsForWeek } from "../actions";
import { getWeekDays, getWeekRange } from "@/lib/date-utils";
import { Shift, Employee } from "@/types";
import { supabase } from "@/lib/supabase";
import { ScheduleGridClient } from "./schedule-grid-client";

interface Props {
    date: Date;
}

export async function ScheduleGrid({ date }: Props) {
    const { start, end } = getWeekRange(date);
    const days = getWeekDays(start);

    const [shiftsData, employeesData] = await Promise.all([
        getShiftsForWeek(start, end),
        supabase.from("employees").select("*").order("first_name"),
    ]);

    // @ts-ignore
    const shifts: Shift[] = shiftsData || [];
    const employees: Employee[] = (employeesData.data as Employee[]) || [];

    return (
        <ScheduleGridClient
            initialShifts={shifts}
            employees={employees}
            days={days}
        />
    );
}