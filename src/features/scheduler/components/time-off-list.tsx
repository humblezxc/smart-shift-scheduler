import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeleteTimeOffButton } from "./delete-time-off-button";

export async function TimeOffList() {
    const { data: requests } = await supabase
        .from("time_off_requests")
        .select(`
      *,
      employee:employees (first_name, last_name, role)
    `)
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true });

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                    <span>📅 Availability / Requests</span>
                    <Badge variant="secondary">{requests?.length || 0}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px] px-4">
                    {!requests?.length && (
                        <div className="text-center text-gray-400 py-8 text-sm">
                            No active requests
                        </div>
                    )}
                    <div className="space-y-2 pb-4 pt-2">
                        {requests?.map((req) => (
                            <div
                                key={req.id}
                                className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-md"
                            >
                                <div>
                                    <div className="font-medium text-sm">
                                        {req.employee?.first_name} {req.employee?.last_name}
                                    </div>
                                    <div className="text-xs text-red-600 font-medium">
                                        {format(new Date(req.date), "EEE, MMM d")}
                                    </div>
                                    {req.reason && (
                                        <div className="text-[10px] text-gray-500 italic">"{req.reason}"</div>
                                    )}
                                </div>
                                <DeleteTimeOffButton id={req.id} />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}