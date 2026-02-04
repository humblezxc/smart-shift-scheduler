"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { ShiftTemplate } from "../actions";
import { APPLICABLE_DAYS } from "../constants";

interface ShiftTemplatesSectionProps {
    templates: ShiftTemplate[] | undefined;
    onAdd: (template: Omit<ShiftTemplate, "id">) => void;
    onDelete: (id: string) => void;
    isPending: boolean;
    canEdit?: boolean;
}

export function ShiftTemplatesSection({ templates, onAdd, onDelete, isPending, canEdit = false }: ShiftTemplatesSectionProps) {
    const { t } = useLanguage();
    const [newTemplate, setNewTemplate] = useState<Omit<ShiftTemplate, "id">>({
        name: "",
        start_time: "09:00",
        end_time: "17:00",
        applicable_days: ["weekday"],
    });

    const toggleApplicableDay = (day: string) => {
        setNewTemplate((prev) => ({
            ...prev,
            applicable_days: prev.applicable_days.includes(day)
                ? prev.applicable_days.filter((d) => d !== day)
                : [...prev.applicable_days, day],
        }));
    };

    const handleAdd = () => {
        if (!newTemplate.name) return;
        onAdd(newTemplate);
        setNewTemplate({
            name: "",
            start_time: "09:00",
            end_time: "17:00",
            applicable_days: ["weekday"],
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("settings.shiftTemplates") || "Shift Templates"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {templates?.map((template, index) => (
                        <div
                            key={template.id || `template-${index}`}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <div>
                                <p className="font-medium">{template.name}</p>
                                <p className="text-sm text-gray-500">
                                    {template.start_time} - {template.end_time} |{" "}
                                    {template.applicable_days?.join(", ") || "all days"}
                                </p>
                            </div>
                            {canEdit && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => template.id && onDelete(template.id)}
                                    disabled={isPending || !template.id}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {canEdit && (
                    <div className="border-t pt-4 space-y-3">
                        <p className="text-sm font-medium text-gray-700">
                            {t("settings.addTemplate") || "Add New Template"}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Input
                                placeholder={t("settings.templateName") || "Template name"}
                                value={newTemplate.name}
                                onChange={(e) => setNewTemplate((p) => ({ ...p, name: e.target.value }))}
                            />
                            <Input
                                type="time"
                                value={newTemplate.start_time}
                                onChange={(e) => setNewTemplate((p) => ({ ...p, start_time: e.target.value }))}
                            />
                            <Input
                                type="time"
                                value={newTemplate.end_time}
                                onChange={(e) => setNewTemplate((p) => ({ ...p, end_time: e.target.value }))}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {APPLICABLE_DAYS.map((day) => (
                                <Button
                                    key={day}
                                    size="sm"
                                    variant={newTemplate.applicable_days.includes(day) ? "default" : "outline"}
                                    onClick={() => toggleApplicableDay(day)}
                                >
                                    {day}
                                </Button>
                            ))}
                        </div>
                        <Button onClick={handleAdd} disabled={isPending || !newTemplate.name}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t("settings.addTemplate") || "Add Template"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
