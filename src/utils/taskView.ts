import type { Task, TaskPriority, TaskStatus } from '../types/task';

export interface TaskFilters {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
}

export const DEFAULT_FILTERS: TaskFilters = { search: '', status: 'all', priority: 'all' };

export function filterTasks(tasks: Task[], { search, status, priority }: TaskFilters): Task[] {
  const query = search.trim().toLowerCase();
  return tasks.filter((t) => {
    if (status !== 'all' && t.status !== status) return false;
    if (priority !== 'all' && t.priority !== priority) return false;
    if (!query) return true;
    return (
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      Object.values(t.customFields).some((value) => value.toLowerCase().includes(query))
    );
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Formats a yyyy-mm-dd calendar date without timezone shifts. */
export function formatDate(value: string): string {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
}

/** "api, backend, API" -> ["api", "backend"] (trimmed, empty and duplicate tags removed). */
export function parseTags(text: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of text.split(',')) {
    const tag = raw.trim();
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }
  return tags;
}

export const formatTags = (tags: string[]): string => tags.join(', ');
