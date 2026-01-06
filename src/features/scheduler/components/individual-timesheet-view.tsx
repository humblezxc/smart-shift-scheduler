"use client";

import React, { forwardRef } from "react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, isWeekend } from "date-fns";
import { pl, uk, enUS } from "date-fns/locale";
import { Employee, Shift } from "@/types";
import { useLanguage } from "@/context/language-context";
import { calculateTotalHours } from "@/lib/shift-utils";

interface Props {
    date: Date;
    employees: Employee[];
    shifts: Shift[];
}

export const IndividualTimesheetView = forwardRef<HTMLDivElement, Props>(({ date, employees, shifts }, ref) => {
    const { language, t } = useLanguage();
    const dateLocale = language === 'uk' ? uk : language === 'pl' ? pl : enUS;

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(date),
        end: endOfMonth(date),
    });

    return (
        <div ref={ref} className="bg-white text-black print-container">
            <style type="text/css" media="print">
                {`
                @page { size: A4 portrait; margin: 10mm; }
                body { -webkit-print-color-adjust: exact; }
                .page-break { page-break-after: always; }
                table { border-collapse: collapse; width: 100%; font-size: 11px; }
                th, td { border: 1px solid #000; padding: 4px; text-align: center; vertical-align: middle; height: 22px; }
                th { background-color: #e5e5e5 !important; font-weight: bold; }
                .weekend { background-color: #f3f3f3 !important; }
                `}
            </style>

            {employees.map((emp, index) => {
                const empShifts = shifts.filter(s => s.employee_id === emp.id);
                const totalHours = calculateTotalHours(empShifts);

                return (
                    <div key={emp.id} className={index < employees.length - 1 ? "page-break" : ""}>
                        <div className="text-center mb-6">
                            <h1 className="text-xl font-bold uppercase mb-2">
                                {t("timesheet.title")}
                            </h1>
                            <p className="text-sm mb-4">
                                {t("timesheet.subtitle")}
                                <span className="font-bold border-b border-black px-2 mx-1">
                                    {format(date, "MM/yyyy")}
                                </span>
                            </p>
                            <div className="text-left mt-4 text-sm">
                                {t("timesheet.contractor")}:
                                <span className="font-bold border-b border-black px-4 ml-2 text-lg">
                                    {emp.first_name} {emp.last_name}
                                </span>
                            </div>
                        </div>
                        <table className="w-full border border-black">
                            <thead>
                            <tr>
                                <th className="w-[10%]">{t("timesheet.day")}</th>
                                <th className="w-[30%]">{t("timesheet.hours")}</th>
                                <th className="w-[30%]">{t("timesheet.sign_contractor")}</th>
                                <th className="w-[30%]">{t("timesheet.sign_client")}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {daysInMonth.map((day) => {
                                const shift = empShifts.find((s) =>
                                    isSameDay(new Date(s.start_time), day)
                                );

                                const isWknd = isWeekend(day);

                                let timeString = "-";
                                if (shift) {
                                    const startStr = format(new Date(shift.start_time), "HH:mm");
                                    const endStr = format(new Date(shift.end_time), "HH:mm");
                                    timeString = `${startStr} - ${endStr}`;
                                }

                                return (
                                    <tr key={day.toString()} className={isWknd ? "weekend" : ""}>
                                        <td className="font-bold">{format(day, "d")}</td>
                                        <td>{timeString}</td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                );
                            })}
                            <tr>
                                <td className="font-bold bg-gray-100 text-right pr-2">
                                    {t("timesheet.total")}
                                </td>
                                <td className="font-bold bg-gray-100">
                                    {Math.round(totalHours)} h
                                </td>
                                <td className="bg-gray-100"></td>
                                <td className="bg-gray-100"></td>
                            </tr>
                            </tbody>
                        </table>
                        <div className="mt-4 text-[10px] text-gray-400 text-right">
                            Smart Shift Scheduler • {t("timesheet.generated")} {format(new Date(), "yyyy-MM-dd")}
                        </div>
                        <div className="h-8"></div>
                    </div>
                );
            })}
        </div>
    );
});

IndividualTimesheetView.displayName = "IndividualTimesheetView";