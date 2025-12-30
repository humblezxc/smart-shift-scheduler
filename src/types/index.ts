export interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    role: 'manager' | 'cashier' | 'student';
    max_hours_per_week: number;
    hourly_rate: number;
}