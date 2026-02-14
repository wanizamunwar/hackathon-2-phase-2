"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth";
import { api, Task } from "@/lib/api";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import SearchFilter from "@/components/SearchFilter";
import SortControls from "@/components/SortControls";
import ChatInterface from "@/components/ChatInterface";

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

  const handleLogout = async () => {
    await signOut();
    router.push("/signin");
  };

  const handleRefresh = () => {
    fetchTasks();
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Todo Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session?.user?.name || session?.user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
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

        {loading ? (
          <p className="text-center text-gray-500">Loading tasks...</p>
        ) : (
          <TaskList
            tasks={tasks}
            userId={userId || ""}
            onTaskUpdated={handleRefresh}
            onTaskDeleted={handleRefresh}
          />
        )}
      </main>

      {userId && <ChatInterface userId={userId} />}
    </div>
  );
}
