"use client";

import { ClipboardList } from "lucide-react";
import { Task } from "@/lib/api";
import TaskItem from "./TaskItem";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskListProps {
  tasks: Task[];
  userId: string;
  loading?: boolean;
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
}

function TaskSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-4 w-4 rounded mt-1" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TaskList({
  tasks,
  userId,
  loading,
  onTaskUpdated,
  onTaskDeleted,
}: TaskListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <TaskSkeleton />
        <TaskSkeleton />
        <TaskSkeleton />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <ClipboardList className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">No tasks yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first task above to get started!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        Your Tasks ({tasks.length})
      </h2>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          userId={userId}
          onTaskUpdated={onTaskUpdated}
          onTaskDeleted={onTaskDeleted}
        />
      ))}
    </div>
  );
}
