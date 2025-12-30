"use server";

import { supabase } from "@/lib/supabase";
import { startOfDay, endOfDay } from "date-fns";

export async function getShiftsForWeek(startOfWeek: Date, endOfWeek: Date) {
    const { data, error } = await supabase
        .from("shifts")
        .select(`
      *,
      employee:employees (
        first_name,
        last_name,
        role
      )
    `)
        .gte("start_time", startOfDay(startOfWeek).toISOString())
        .lte("start_time", endOfDay(endOfWeek).toISOString());

    if (error) {
        console.error("Error fetching shifts:", error);
        return [];
    }

    return data || [];
}