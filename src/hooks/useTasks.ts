import { useCallback, useEffect, useState } from 'react';
import { taskApi } from '../services/taskApi';
import type { Task, TaskInput, TaskPatch } from '../types/task';

interface UseTasks {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (input: TaskInput) => Promise<void>;
  updateTask: (id: string, patch: TaskPatch) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const toMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

export function useTasks(): UseTasks {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await taskApi.list());
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Mutations re-throw so the calling UI (e.g. a dialog) can show the error and stay open.
  const createTask = useCallback(async (input: TaskInput) => {
    const created = await taskApi.create(input);
    setTasks((prev) => [created, ...prev]);
  }, []);

  const updateTask = useCallback(async (id: string, patch: TaskPatch) => {
    const updated = await taskApi.update(id, patch);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await taskApi.remove(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, error, createTask, updateTask, deleteTask, reload };
}
