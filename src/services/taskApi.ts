import type { Task, TaskInput, TaskPatch, TaskPriority, TaskStatus } from '../types/task';

/** Client-side contract; implemented by the Azure Functions API and a local mock. */
export interface TaskApi {
  list(): Promise<Task[]>;
  create(input: TaskInput): Promise<Task>;
  update(id: string, patch: TaskPatch): Promise<Task>;
  remove(id: string): Promise<void>;
}

/** Wire format of the back-end (see task.schema.json in the API repo). */
interface ApiTask {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status: TaskStatus;
  tags?: string[];
}

const fromApi = (t: ApiTask): Task => ({
  id: t.id,
  title: t.title,
  description: t.description ?? '',
  status: t.status,
  priority: t.priority ?? 'medium',
  dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
  tags: t.tags ?? [],
});

/** The UI works with calendar dates; the API stores date-times (sent as midnight UTC). */
const toApiDate = (date: string) => `${date}T00:00:00.000Z`;

const toApiCreate = (input: TaskInput) => ({
  title: input.title,
  status: input.status,
  priority: input.priority,
  tags: input.tags,
  ...(input.description && { description: input.description }),
  ...(input.dueDate && { dueDate: toApiDate(input.dueDate) }),
});

/** In PATCH bodies `null` clears an optional field on the server. */
const toApiPatch = (patch: TaskPatch) => ({
  ...(patch.title !== undefined && { title: patch.title }),
  ...(patch.status !== undefined && { status: patch.status }),
  ...(patch.priority !== undefined && { priority: patch.priority }),
  ...(patch.tags !== undefined && { tags: patch.tags }),
  ...(patch.description !== undefined && { description: patch.description || null }),
  ...(patch.dueDate !== undefined && { dueDate: patch.dueDate ? toApiDate(patch.dueDate) : null }),
});

interface HttpConfig {
  baseUrl: string;
  organizationId: string;
  functionKey?: string;
}

class HttpTaskApi implements TaskApi {
  constructor(private readonly config: HttpConfig) {}

  private async request<T>(path: string, method: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'x-organization-id': this.config.organizationId };
    if (this.config.functionKey) headers['x-functions-key'] = this.config.functionKey;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) throw new Error(await readError(res));
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  async list() {
    return (await this.request<ApiTask[]>('/tasks', 'GET')).map(fromApi);
  }
  async create(input: TaskInput) {
    return fromApi(await this.request<ApiTask>('/tasks', 'POST', toApiCreate(input)));
  }
  async update(id: string, patch: TaskPatch) {
    return fromApi(
      await this.request<ApiTask>(`/tasks/${encodeURIComponent(id)}`, 'PATCH', toApiPatch(patch)),
    );
  }
  async remove(id: string) {
    await this.request<void>(`/tasks/${encodeURIComponent(id)}`, 'DELETE');
  }
}

/** Turns the API's `{ error: { message, details } }` payload into a readable message. */
async function readError(res: Response): Promise<string> {
  try {
    const { error } = (await res.json()) as { error?: { message?: string; details?: string[] } };
    if (error?.message) return [error.message, ...(error.details ?? [])].join(' — ');
  } catch {
    /* non-JSON error body */
  }
  return `Request failed (${res.status})`;
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
    const task: Task = { ...input, id: crypto.randomUUID() };
    this.write([task, ...this.read()]);
    return task;
  }

  async update(id: string, patch: TaskPatch) {
    const tasks = this.read();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Task not found');
    const updated: Task = { ...tasks[index], ...patch };
    tasks[index] = updated;
    this.write(tasks);
    return updated;
  }

  async remove(id: string) {
    this.write(this.read().filter((t) => t.id !== id));
  }
}

function seedTasks(): Task[] {
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
  const statuses = ['todo', 'in-progress', 'completed'] as const;
  const priorities = ['low', 'medium', 'high'] as const;
  return titles.map((title, i) => ({
    id: crypto.randomUUID(),
    title,
    description: `Details for "${title.toLowerCase()}".`,
    status: statuses[i % 3],
    priority: priorities[i % 3],
    dueDate: new Date(Date.now() + (i + 1) * 86_400_000).toISOString().slice(0, 10),
    tags: i % 2 === 0 ? ['frontend'] : ['backend', 'api'],
  }));
}

function createTaskApi(): TaskApi {
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (!baseUrl) return new LocalTaskApi();

  const organizationId = import.meta.env.VITE_ORGANIZATION_ID;
  if (!organizationId) {
    throw new Error('VITE_ORGANIZATION_ID is required when VITE_API_URL is set (see .env.example).');
  }
  return new HttpTaskApi({ baseUrl, organizationId, functionKey: import.meta.env.VITE_API_KEY });
}

export const taskApi: TaskApi = createTaskApi();
