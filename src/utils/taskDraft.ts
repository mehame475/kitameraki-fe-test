import type { CustomFieldType, FormField } from '../types/formSettings';
import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types/task';
import { formatDate, formatTags, parseTags } from './taskView';

/** Editable form state for a task (strings only, so it maps directly onto inputs). */
export interface TaskDraft {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  tagsText: string;
  /** Custom field values keyed by field id, stored as the API stores them. */
  custom: Record<string, string>;
}

export const emptyDraft = (): TaskDraft => ({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  tagsText: '',
  custom: {},
});

export const toDraft = (task: Task): TaskDraft => ({
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  tagsText: formatTags(task.tags),
  custom: { ...task.customFields },
});

/** Only values of fields that still exist (and are non-empty) are sent to the API. */
export function fromDraft(draft: TaskDraft, fields: FormField[]): TaskInput {
  const customFields: Record<string, string> = {};
  for (const field of fields) {
    const value = draft.custom[field.id]?.trim();
    if (field.kind === 'custom' && value) customFields[field.id] = value;
  }
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    status: draft.status,
    priority: draft.priority,
    dueDate: draft.dueDate,
    tags: parseTags(draft.tagsText),
    customFields,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns error messages keyed by field id (empty object = valid). */
export function validateDraft(draft: TaskDraft, fields: FormField[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.kind === 'builtin' && field.key === 'title' && !draft.title.trim()) {
      errors[field.id] = `${field.label} is required.`;
    }
    if (field.kind === 'custom' && field.type === 'email') {
      const value = draft.custom[field.id]?.trim();
      if (value && !EMAIL_RE.test(value)) errors[field.id] = 'Enter a valid email address.';
    }
  }
  return errors;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Stored value -> value of the matching <input> (datetime is stored as ISO, edited in local time). */
export function toInputValue(type: CustomFieldType, stored: string): string {
  if (!stored) return '';
  if (type !== 'datetime') return stored;
  const d = new Date(stored);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromInputValue(type: CustomFieldType, input: string): string {
  if (!input || type !== 'datetime') return input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

/** Human readable value for the task table. */
export function formatCustomValue(type: CustomFieldType, stored: string | undefined): string {
  if (!stored) return '-';
  if (type === 'date') return formatDate(stored);
  if (type === 'datetime') {
    const d = new Date(stored);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }
  return stored;
}
