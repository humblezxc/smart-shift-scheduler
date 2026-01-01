export interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    role: 'manager' | 'cashier' | 'student' | 'owner';
    share_token: string;
    max_hours_per_week: number;
    hourly_rate: number;
}

export interface Shift {
    id: number;
    employee_id: number;
    start_time: string;
    end_time: string;

    employee?: Employee;
}