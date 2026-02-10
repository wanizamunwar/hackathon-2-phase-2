import { authClient } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://hackathon-2-phase-2-production-0c5c.up.railway.app";

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  try {
    const { data } = await authClient.token();
    if (data?.token) {
      headers["Authorization"] = `Bearer ${data.token}`;
    }
  } catch {
    // No token available
  }

  return headers;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  getTasks: (userId: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiRequest<Task[]>(`/api/${userId}/tasks${query}`);
  },

  getTask: (userId: string, taskId: number) =>
    apiRequest<Task>(`/api/${userId}/tasks/${taskId}`),

  createTask: (userId: string, data: CreateTaskData) =>
    apiRequest<Task>(`/api/${userId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTask: (userId: string, taskId: number, data: UpdateTaskData) =>
    apiRequest<Task>(`/api/${userId}/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteTask: (userId: string, taskId: number) =>
    apiRequest<void>(`/api/${userId}/tasks/${taskId}`, {
      method: "DELETE",
    }),

  toggleComplete: (userId: string, taskId: number) =>
    apiRequest<Task>(`/api/${userId}/tasks/${taskId}/complete`, {
      method: "PATCH",
    }),
};

export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: string;
  tags?: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: string;
  tags?: string[];
}
