"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setupOrganization } from "./actions";

export function SetupOrgForm() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        const result = await setupOrganization(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    placeholder="My Company"
                    required
                    disabled={loading}
                />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Organization"}
            </Button>
        </form>
    );
}
