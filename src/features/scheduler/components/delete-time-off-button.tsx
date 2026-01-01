"use client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteTimeOffRequest } from "../actions";
import { toast } from "sonner";

export function DeleteTimeOffButton({ id }: { id: number }) {
    const handleDelete = async () => {
        const res = await deleteTimeOffRequest(id);
        if (res.error) toast.error("Error");
        else toast.success("Request removed");
    };

    return (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
        </Button>
    );
}