"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateSchedule } from "../actions";

export function GenerateButton() {
    const [loading, setLoading] = useState(false);

    async function handleGenerate() {
        setLoading(true);
        try {
            const result = await generateSchedule();

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Generated ${result.count} shifts!`);
            }
        } catch (e) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
        >
            {loading ? (
                "AI is thinking..."
            ) : (
                <>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate Schedule (AI)
                </>
            )}
        </Button>
    );
}