"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";
import { api, Task } from "@/lib/api";
import { cn } from "@/lib/utils";
import TaskForm from "./TaskForm";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const priorityVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

interface TaskItemProps {
  task: Task;
  userId: string;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

export default function TaskItem({ task, userId, onTaskUpdated, onTaskDeleted }: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleComplete = async () => {
    setLoading(true);
    try {
      await api.toggleComplete(userId, task.id);
      onTaskUpdated();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.deleteTask(userId, task.id);
      onTaskDeleted();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  if (editing) {
    return (
      <TaskForm
        userId={userId}
        editMode
        taskId={task.id}
        initialData={{
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          tags: task.tags,
        }}
        onTaskCreated={onTaskUpdated}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <Card
        className={cn(
          "p-4 transition-all hover:shadow-md",
          task.completed && "opacity-60"
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            disabled={loading}
            className="mt-0.5"
            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={cn(
                  "font-medium",
                  task.completed && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </h3>
              <Badge variant={priorityVariant[task.priority] || "secondary"}>
                {task.priority}
              </Badge>
            </div>

            {task.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {task.description}
              </p>
            )}

            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(task.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{task.title}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
