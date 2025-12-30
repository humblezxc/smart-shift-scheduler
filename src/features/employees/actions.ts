"use server";

import { supabase } from "@/lib/supabase";
import { employeeSchema, EmployeeFormValues } from "./schemas";
import { revalidatePath } from "next/cache";

export async function createEmployee(data: EmployeeFormValues) {
    const result = employeeSchema.safeParse(data);

    if (!result.success) {
        return { error: "Validation failed" };
    }

    const { error } = await supabase.from("employees").insert(result.data);

    if (error) {
        console.error(error);
        return { error: "Database error: Could not save employee" };
    }

    revalidatePath("/");

    return { success: true };
}