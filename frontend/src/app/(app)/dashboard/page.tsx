"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth";
import { api, Task } from "@/lib/api";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import SearchFilter from "@/components/SearchFilter";
import SortControls from "@/components/SortControls";
import ChatInterface from "@/components/ChatInterface";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const userId = session?.user?.id;

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const params: Record<string, string> = {
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (tagFilter) params.tag = tagFilter;

      const data = await api.getTasks(userId, params);
      setTasks(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [userId, search, statusFilter, priorityFilter, tagFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
      return;
    }
    if (userId) {
      fetchTasks();
    }
  }, [userId, isPending, session, router, fetchTasks]);

  const handleRefresh = () => {
    fetchTasks();
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Manage your tasks and stay organized.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <TaskForm userId={userId || ""} onTaskCreated={handleRefresh} />

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        tagFilter={tagFilter}
        onTagChange={setTagFilter}
      />

      <div className="flex justify-end">
        <SortControls
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />
      </div>

      <TaskList
        tasks={tasks}
        userId={userId || ""}
        loading={loading}
        onTaskUpdated={handleRefresh}
        onTaskDeleted={handleRefresh}
      />

      {userId && <ChatInterface userId={userId} mode="widget" />}
    </div>
  );
}
