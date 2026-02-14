"use client";

import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortControlsProps {
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
}

export default function SortControls({
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: SortControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Date Created</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="title">Title</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
        title={sortOrder === "asc" ? "Ascending" : "Descending"}
      >
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
