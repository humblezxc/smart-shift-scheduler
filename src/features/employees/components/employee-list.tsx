import { supabase } from "@/lib/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export async function EmployeeList() {

    const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .order('id');

    if (error) {
        return <div className="text-red-500">Error loading employees</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Max Hours</TableHead>
                        <TableHead className="text-right">Rate (PLN)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees?.map((employee) => (
                        <TableRow key={employee.id}>
                            <TableCell className="font-medium">
                                {employee.first_name} {employee.last_name}
                            </TableCell>
                            <TableCell>
                                <Badge variant={employee.role === 'manager' ? 'default' : 'secondary'}>
                                    {employee.role}
                                </Badge>
                            </TableCell>
                            <TableCell>{employee.max_hours_per_week}h</TableCell>
                            <TableCell className="text-right">{employee.hourly_rate}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}