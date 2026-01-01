import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CalendarPlus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestTimeOff } from "@/features/employees/components/request-time-off";
import { RejectShiftButton } from "@/features/employees/components/reject-shift-button";

function getGoogleCalendarLink(shift: any, employeeName: string) {
    const start = new Date(shift.start_time).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(shift.end_time).toISOString().replace(/-|:|\.\d\d\d/g, "");

    const text = encodeURIComponent(`Shift: ${employeeName} - Żabka`);
    const details = encodeURIComponent("Work shift scheduled via Smart Scheduler.");

    const location = encodeURIComponent("Długa 55K, 53-633 Wrocław");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
}

export default async function EmployeeSchedulePage({ params, }: { params: Promise<{ token: string }>; }) {
    const { token } = await params;

    const { data: employee } = await supabase
        .from("employees")
        .select("*")
        .eq("share_token", token)
        .single();

    if (!employee) {
        return notFound();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: shifts } = await supabase
        .from("shifts")
        .select("*")
        .eq("employee_id", employee.id)
        .gte("start_time", today.toISOString())
        .order("start_time", { ascending: true });

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto space-y-6">
                <div className="text-center space-y-2 pt-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-2xl">
                        👋
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Hi, {employee.first_name}!
                    </h1>
                    <p className="text-gray-500">Here are your upcoming shifts</p>
                </div>
                <div className="flex justify-center pb-2">
                    <RequestTimeOff employeeId={employee.id} />
                </div>
                <div className="space-y-4">
                    {!shifts || shifts.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center text-gray-500">
                                No upcoming shifts scheduled. Enjoy your rest! 🌴
                            </CardContent>
                        </Card>
                    ) : (
                        shifts.map((shift) => {
                            const startDate = new Date(shift.start_time);
                            const endDate = new Date(shift.end_time);
                            const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

                            return (
                                <Card key={shift.id} className="border-l-4 border-l-blue-500 shadow-sm">
                                    <CardContent className="p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">
                                                    {format(startDate, "EEEE, MMM d")}
                                                </h3>
                                                <div className="flex items-center text-gray-500 text-sm mt-1">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                                                </div>
                                            </div>
                                            <Badge variant="secondary">{duration}h</Badge>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <Button
                                                variant="outline"
                                                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 mt-2"
                                                asChild
                                            >
                                                <a
                                                    href={getGoogleCalendarLink(shift, employee.first_name)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <CalendarPlus className="w-4 h-4 mr-2" />
                                                    Add to Google Calendar
                                                </a>
                                            </Button>
                                            <RejectShiftButton
                                                employeeId={employee.id}
                                                date={startDate}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                <div className="text-center text-xs text-gray-400 py-6">
                    Smart Shift Scheduler © {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}