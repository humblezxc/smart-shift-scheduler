import { z } from "zod";
import { EMPLOYEE_COLOR_SLUGS } from "@/lib/employee-colors";

export const employeeSchema = z.object({
    first_name: z.string().min(2, "Name must be at least 2 characters"),
    last_name: z.string().min(2, "Surname must be at least 2 characters"),
    role: z.enum(["manager", "cashier", "student", "owner"]),
    max_hours_per_week: z.coerce.number().min(1).max(168),
    hourly_rate: z.coerce.number().min(1, "Rate must be positive"),
    color: z.enum(EMPLOYEE_COLOR_SLUGS).nullable().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;