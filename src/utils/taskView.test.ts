import { describe, expect, it } from 'vitest';
import type { Task } from '../types/task';
import { DEFAULT_FILTERS, filterTasks, formatTags, pageCount, paginate, parseTags } from './taskView';

const make = (over: Partial<Task>): Task => ({
  id: crypto.randomUUID(),
  title: 'Task',
  description: '',
  status: 'todo',
  priority: 'low',
  dueDate: '',
  tags: [],
  ...over,
});

describe('filterTasks', () => {
  const tasks = [
    make({ title: 'Write docs', status: 'completed', priority: 'high', tags: ['urgent'] }),
    make({ title: 'Fix bug', description: 'login page', status: 'todo' }),
  ];

  it('returns everything with default filters', () => {
    expect(filterTasks(tasks, DEFAULT_FILTERS)).toHaveLength(2);
  });
  it('searches title and description, case-insensitively', () => {
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, search: 'LOGIN' })).toHaveLength(1);
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, search: 'docs' })).toHaveLength(1);
  });
  it('searches tags', () => {
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, search: 'urg' })).toHaveLength(1);
  });
  it('filters by status and priority', () => {
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, status: 'completed' })).toHaveLength(1);
    expect(filterTasks(tasks, { ...DEFAULT_FILTERS, priority: 'high' })).toHaveLength(1);
  });
});

describe('pagination', () => {
  const items = Array.from({ length: 23 }, (_, i) => i);
  it('slices pages', () => {
    expect(paginate(items, 3, 10)).toEqual([20, 21, 22]);
  });
  it('computes page count (min 1)', () => {
    expect(pageCount(23, 10)).toBe(3);
    expect(pageCount(0, 10)).toBe(1);
  });
});

describe('tags', () => {
  it('parses comma separated text, trimming and de-duplicating', () => {
    expect(parseTags(' api, Backend ,, API ')).toEqual(['api', 'Backend']);
    expect(parseTags('')).toEqual([]);
  });
  it('formats tags for editing', () => {
    expect(formatTags(['a', 'b'])).toBe('a, b');
  });
});
