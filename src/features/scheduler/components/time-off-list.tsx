"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DeleteTimeOffButton } from "./delete-time-off-button";
import { useLanguage } from "@/context/language-context";

interface TimeOffListProps {
    requests: any[];
    canManage?: boolean;
}

export function TimeOffList({ requests, canManage = false }: TimeOffListProps) {
    const { t } = useLanguage();

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                    <span>📅 {t("common.requests") || "Requests"}</span>
                    <Badge variant="secondary">{requests?.length || 0}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px] px-4">
                    {!requests?.length && (
                        <div className="text-center text-muted-foreground py-8 text-sm">
                            {t("common.no_active_requests") || "No active requests"}
                        </div>
                    )}
                    <div className="space-y-2 pb-4 pt-2">
                        {requests?.map((req) => (
                            <div
                                key={req.id}
                                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 rounded-md"
                            >
                                <div>
                                    <div className="font-medium text-sm">
                                        {req.employee?.first_name} {req.employee?.last_name}
                                    </div>
                                    <div className="text-xs text-red-600 font-medium">
                                        {format(new Date(req.date), "EEE, MMM d")}
                                    </div>
                                    {req.reason && (
                                        <div className="text-[10px] text-muted-foreground italic">"{req.reason}"</div>
                                    )}
                                </div>
                                {canManage && <DeleteTimeOffButton id={req.id} />}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}