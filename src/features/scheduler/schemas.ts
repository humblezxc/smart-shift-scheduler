import { z } from "zod";

export const shiftSchema = z.object({
    employee_id: z.coerce.number().min(1, "Select an employee"),
    date: z.date(),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
}).refine((data) => {
    return data.end_time > data.start_time;
}, {
    message: "End time must be after start time",
    path: ["end_time"],
});

export type ShiftFormValues = z.infer<typeof shiftSchema>;

export const timeOffSchema = z.object({
    employee_id: z.number(),
    date: z.date(),
    reason: z.string().optional(),
});

export type TimeOffRequestValues = z.infer<typeof timeOffSchema>;