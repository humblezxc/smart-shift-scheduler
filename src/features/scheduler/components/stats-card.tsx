import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Clock, Users } from "lucide-react";

interface StatsProps {
    stats: {
        totalShifts: number;
        totalHours: number;
        totalCost: number;
    };
}

export function StatsCard({ stats }: StatsProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Weekly Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                        <Coins className="mr-2 h-4 w-4 text-green-600" />
                        Est. Cost
                    </div>
                    <div className="font-bold text-lg text-green-700">
                        {stats.totalCost} PLN
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                        <Clock className="mr-2 h-4 w-4 text-blue-500" />
                        Total Hours
                    </div>
                    <div className="font-medium">
                        {stats.totalHours} h
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                        <Users className="mr-2 h-4 w-4 text-orange-500" />
                        Total Shifts
                    </div>
                    <div className="font-medium">
                        {stats.totalShifts}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}