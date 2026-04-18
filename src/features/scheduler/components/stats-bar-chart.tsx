"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Row {
    name: string;
    hours: number;
    cost: number;
}

export default function StatsBarChart({ data, hoursLabel }: { data: Row[]; hoursLabel: string }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="hours" fill="hsl(var(--chart-2))" name={hoursLabel} radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" fill="hsl(var(--chart-1))" name="PLN" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
