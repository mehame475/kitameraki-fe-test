import { describe, expect, it } from 'vitest';
import { DEFAULT_FORM_SETTINGS, type FormSettings } from '../types/formSettings';
import {
  addField,
  createCustomField,
  flattenFields,
  moveField,
  removeField,
  renameField,
} from './formLayout';

const ids = (s: FormSettings) => s.rows.map((r) => r.fields.map((f) => f.id));

describe('addField', () => {
  it('appends a new custom field as a new row at the end by default', () => {
    const field = createCustomField('email');
    const next = addField(DEFAULT_FORM_SETTINGS, field);
    expect(next.rows).toHaveLength(DEFAULT_FORM_SETTINGS.rows.length + 1);
    expect(next.rows[next.rows.length - 1].fields).toEqual([field]);
  });

  it('inserts before a row, or fills the second column of a single-field row', () => {
    const field = createCustomField('text');
    expect(ids(addField(DEFAULT_FORM_SETTINGS, field, { kind: 'gap', beforeRowId: 'row-status' }))[2]).toEqual([field.id]);
    expect(ids(addField(DEFAULT_FORM_SETTINGS, field, { kind: 'slot', rowId: 'row-title' }))[0]).toEqual(['title', field.id]);
  });

  it('never creates a row with more than two columns', () => {
    const field = createCustomField('text');
    const next = addField(DEFAULT_FORM_SETTINGS, field, { kind: 'slot', rowId: 'row-status' });
    expect(next.rows.every((r) => r.fields.length <= 2)).toBe(true);
    expect(flattenFields(next)).toHaveLength(7);
  });
});

describe('moveField', () => {
  it('moves a field into the second column and drops the emptied row', () => {
    const next = moveField(DEFAULT_FORM_SETTINGS, 'description', { kind: 'slot', rowId: 'row-title' });
    expect(ids(next)).toEqual([['title', 'description'], ['status', 'priority'], ['dueDate', 'tags']]);
  });

  it('moves a field to a gap, keeping the position correct when its own row disappears', () => {
    const next = moveField(DEFAULT_FORM_SETTINGS, 'title', { kind: 'gap', beforeRowId: 'row-due' });
    expect(ids(next)).toEqual([['description'], ['status', 'priority'], ['title'], ['dueDate', 'tags']]);
    const end = moveField(DEFAULT_FORM_SETTINGS, 'title', { kind: 'gap', beforeRowId: null });
    expect(ids(end)[3]).toEqual(['title']);
  });

  it('splits a two-column row when one field is moved out', () => {
    const next = moveField(DEFAULT_FORM_SETTINGS, 'priority', { kind: 'gap', beforeRowId: 'row-title' });
    expect(ids(next)).toEqual([['priority'], ['title'], ['description'], ['status'], ['dueDate', 'tags']]);
  });

  it('swaps two fields, also across rows', () => {
    const next = moveField(DEFAULT_FORM_SETTINGS, 'title', { kind: 'swap', fieldId: 'priority' });
    expect(ids(next)).toEqual([['priority'], ['description'], ['status', 'title'], ['dueDate', 'tags']]);
  });

  it('ignores invalid drops (full row, own row, unknown field)', () => {
    expect(moveField(DEFAULT_FORM_SETTINGS, 'title', { kind: 'slot', rowId: 'row-status' })).toBe(DEFAULT_FORM_SETTINGS);
    expect(moveField(DEFAULT_FORM_SETTINGS, 'title', { kind: 'slot', rowId: 'row-title' })).toBe(DEFAULT_FORM_SETTINGS);
    expect(moveField(DEFAULT_FORM_SETTINGS, 'nope', { kind: 'gap', beforeRowId: null })).toBe(DEFAULT_FORM_SETTINGS);
  });
});

describe('removeField / renameField', () => {
  it('removes custom fields (and empty rows) but never built-in ones', () => {
    const field = createCustomField('date');
    const withField = addField(DEFAULT_FORM_SETTINGS, field);
    expect(removeField(withField, field.id).rows).toHaveLength(DEFAULT_FORM_SETTINGS.rows.length);
    expect(removeField(withField, 'title')).toBe(withField);
  });

  it('renames any field', () => {
    const next = renameField(DEFAULT_FORM_SETTINGS, 'title', 'Task name');
    expect(flattenFields(next)[0].label).toBe('Task name');
  });
});
