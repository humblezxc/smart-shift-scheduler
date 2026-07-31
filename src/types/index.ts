import { EmployeeColor } from "@/lib/employee-colors";

export interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    role: 'manager' | 'cashier' | 'student' | 'owner';
    max_hours_per_week: number;
    hourly_rate: number;
    color?: EmployeeColor | null;
    archived_at?: string | null;
    archived_by?: string | null;
}

export interface Shift {
    id: number;
    employee_id: number;
    start_time: string;
    end_time: string;

    employee?: Employee;
}