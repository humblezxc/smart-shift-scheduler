"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Employee } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link2, Check } from "lucide-react";
import { toast } from "sonner";

export function EmployeeList() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    async function fetchEmployees() {
        const { data } = await supabase.from("employees").select("*").order("first_name");
        if (data) {
            // @ts-ignore
            setEmployees(data);
        }
    }

    const copyLink = (token: string, id: number) => {
        const url = `${window.location.origin}/s/${token}`;

        navigator.clipboard.writeText(url);
        toast.success("Personal link copied to clipboard!");

        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((employee) => (
                        <TableRow key={employee.id}>
                            <TableCell className="font-medium">
                                {employee.first_name} {employee.last_name}
                            </TableCell>
                            <TableCell>{employee.role}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        // @ts-ignore
                                        copyLink(employee.share_token, employee.id)
                                    }
                                    title="Copy Schedule Link"
                                >
                                    {copiedId === employee.id ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Link2 className="h-4 w-4 text-gray-500" />
                                    )}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}