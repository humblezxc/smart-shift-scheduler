"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Employee } from "@/types";
import { useLanguage } from "@/context/language-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
    currentDate: Date;
    employees: Employee[];
}

export function ExportMenu({ currentDate }: Props) {
    const { t } = useLanguage();
    const monthParam = format(currentDate, "yyyy-MM");

    const open = (kind: "schedule" | "timesheets") => {
        const url = `/print/${kind}?month=${monthParam}`;
        const win = window.open(url, "_blank", "noopener");
        if (!win) {
            window.location.href = url;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {t("common.export")}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => open("schedule")}>
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-600" />
                    {t("common.export_schedule")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => open("timesheets")}>
                    <FileText className="mr-2 h-4 w-4 text-green-600" />
                    {t("common.export_timesheets")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}