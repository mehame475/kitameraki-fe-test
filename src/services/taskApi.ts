import type { Task, TaskInput, TaskPatch } from '../types/task';

/**
 * Contract between the client and the back-end.
 * Adjust the paths/payloads in HttpTaskApi to match the Azure Function endpoints.
 *
 *   GET    /tasks       -> Task[]
 *   POST   /tasks       -> Task
 *   PATCH  /tasks/:id   -> Task
 *   DELETE /tasks/:id   -> 204
 */
export interface TaskApi {
  list(): Promise<Task[]>;
  create(input: TaskInput): Promise<Task>;
  update(id: string, patch: TaskPatch): Promise<Task>;
  remove(id: string): Promise<void>;
}

class HttpTaskApi implements TaskApi {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!res.ok) {
      throw new Error(`Request failed (${res.status}): ${await res.text()}`);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  list() {
    return this.request<Task[]>('/tasks');
  }
  create(input: TaskInput) {
    return this.request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) });
  }
  update(id: string, patch: TaskPatch) {
    return this.request<Task>(`/tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }
  async remove(id: string) {
    await this.request<void>(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
}

const STORAGE_KEY = 'task-manager:tasks';

/** Local mock so the UI can be developed/reviewed without the back-end running. */
class LocalTaskApi implements TaskApi {
  private read(): Task[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Task[];
    } catch {
      /* fall through to seed */
    }
    const seeded = seedTasks();
    this.write(seeded);
    return seeded;
  }

  private write(tasks: Task[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  async list() {
    return this.read();
  }

  async create(input: TaskInput) {
    const now = new Date().toISOString();
    const task: Task = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    this.write([task, ...this.read()]);
    return task;
  }

  async update(id: string, patch: TaskPatch) {
    const tasks = this.read();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Task not found');
    const updated: Task = { ...tasks[index], ...patch, updatedAt: new Date().toISOString() };
    tasks[index] = updated;
    this.write(tasks);
    return updated;
  }

  async remove(id: string) {
    this.write(this.read().filter((t) => t.id !== id));
  }
}

function seedTasks(): Task[] {
  const now = new Date().toISOString();
  const titles = [
    'Set up project repository',
    'Design task list layout',
    'Implement search and filters',
    'Write API integration',
    'Add pagination',
    'Review pull request',
    'Prepare demo',
    'Fix date formatting bug',
    'Update README',
    'Deploy to Azure',
    'Write unit tests',
    'Refactor form dialog',
  ];
  const statuses = ['todo', 'in-progress', 'done'] as const;
  const priorities = ['low', 'medium', 'high'] as const;
  return titles.map((title, i) => ({
    id: crypto.randomUUID(),
    title,
    description: `Details for "${title.toLowerCase()}".`,
    status: statuses[i % 3],
    priority: priorities[i % 3],
    dueDate: new Date(Date.now() + (i + 1) * 86_400_000).toISOString().slice(0, 10),
    createdAt: now,
    updatedAt: now,
  }));
}

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
export const taskApi: TaskApi = apiUrl ? new HttpTaskApi(apiUrl) : new LocalTaskApi();
