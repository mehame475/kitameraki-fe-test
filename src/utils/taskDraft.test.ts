import { describe, expect, it } from 'vitest';
import type { FormField } from '../types/formSettings';
import { emptyDraft, fromDraft, fromInputValue, toInputValue, validateDraft } from './taskDraft';

const title: FormField = { id: 'title', label: 'Title', kind: 'builtin', key: 'title' };
const email: FormField = { id: 'e1', label: 'Contact', kind: 'custom', type: 'email' };
const note: FormField = { id: 'n1', label: 'Note', kind: 'custom', type: 'text' };

describe('validateDraft', () => {
  it('requires a title and a valid email', () => {
    const draft = { ...emptyDraft(), title: '  ', custom: { e1: 'nope' } };
    expect(validateDraft(draft, [title, email])).toEqual({
      title: 'Title is required.',
      e1: 'Enter a valid email address.',
    });
    expect(validateDraft({ ...draft, title: 'x', custom: { e1: 'a@b.co' } }, [title, email])).toEqual({});
  });
});

describe('fromDraft', () => {
  it('trims, parses tags and keeps only non-empty values of existing custom fields', () => {
    const draft = {
      ...emptyDraft(),
      title: ' Task ',
      tagsText: 'a, b',
      custom: { n1: ' hello ', e1: '', gone: 'orphan' },
    };
    const input = fromDraft(draft, [title, email, note]);
    expect(input.title).toBe('Task');
    expect(input.tags).toEqual(['a', 'b']);
    expect(input.customFields).toEqual({ n1: 'hello' });
  });
});

describe('datetime input conversion', () => {
  it('round-trips between ISO and datetime-local values', () => {
    const iso = fromInputValue('datetime', '2026-03-05T14:30');
    expect(toInputValue('datetime', iso)).toBe('2026-03-05T14:30');
    expect(fromInputValue('datetime', '')).toBe('');
    expect(toInputValue('date', '2026-03-05')).toBe('2026-03-05');
  });
});
