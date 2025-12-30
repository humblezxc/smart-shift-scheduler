import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shift } from "@/types";

interface ShiftCardProps {
    shift: Shift;
}

export function ShiftCard({ shift }: ShiftCardProps) {
    const timeString = `${format(new Date(shift.start_time), "HH:mm")} - ${format(
        new Date(shift.end_time),
        "HH:mm"
    )}`;

    const roleColor =
        shift.employee?.role === "manager" ? "default" :
            shift.employee?.role === "student" ? "outline" : "secondary";

    return (
        <Card className="mb-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="p-2 text-xs">
                <div className="font-bold flex justify-between items-center mb-1">
                    <span>{shift.employee?.first_name} {shift.employee?.last_name?.[0]}.</span>
                </div>
                <div className="text-gray-500 mb-1">{timeString}</div>
                <Badge variant={roleColor} className="text-[10px] px-1 py-0 h-4">
                    {shift.employee?.role}
                </Badge>
            </CardContent>
        </Card>
    );
}