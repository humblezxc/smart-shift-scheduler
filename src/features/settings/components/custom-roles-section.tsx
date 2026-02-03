"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useLanguage } from "@/context/language-context";

const DEFAULT_ROLES = ["owner", "manager", "cashier", "student"];

interface CustomRolesSectionProps {
    customRoles: string[] | undefined;
    onAdd: (role: string) => void;
    onDelete: (role: string) => void;
    isPending: boolean;
}

export function CustomRolesSection({ customRoles, onAdd, onDelete, isPending }: CustomRolesSectionProps) {
    const { t } = useLanguage();
    const [newRole, setNewRole] = useState("");

    const handleAdd = () => {
        if (!newRole.trim()) return;
        onAdd(newRole.trim().toLowerCase());
        setNewRole("");
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("settings.customRoles") || "Custom Roles"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {DEFAULT_ROLES.map((role) => (
                        <span key={role} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                            {t(`roles.${role}`) || role}
                        </span>
                    ))}
                    {customRoles
                        ?.filter((role): role is string => typeof role === "string" && role.length > 0)
                        .map((role, index) => (
                            <span
                                key={`custom-${index}-${role}`}
                                className="px-3 py-1 bg-blue-100 rounded-full text-sm flex items-center gap-2"
                            >
                                {role}
                                <button
                                    onClick={() => onDelete(role)}
                                    className="text-red-500 hover:text-red-700"
                                    disabled={isPending}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                </div>

                <div className="flex gap-2">
                    <Input
                        placeholder={t("settings.newRole") || "New role name"}
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    />
                    <Button onClick={handleAdd} disabled={isPending || !newRole.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("common.add") || "Add"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
