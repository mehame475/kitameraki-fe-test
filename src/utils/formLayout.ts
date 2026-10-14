import {
  CUSTOM_TYPE_LABEL,
  MAX_COLUMNS,
  type CustomFieldType,
  type FormField,
  type FormRow,
  type FormSettings,
} from '../types/formSettings';

/** Where a dragged field is dropped. Targets reference ids so they stay valid while rows change. */
export type DropTarget =
  | { kind: 'gap'; beforeRowId: string | null } // new row before the given row (null = at the end)
  | { kind: 'slot'; rowId: string } // second column of a single-field row
  | { kind: 'swap'; fieldId: string }; // exchange places with another field

const END: DropTarget = { kind: 'gap', beforeRowId: null };

const rowOf = (field: FormField): FormRow => ({ id: crypto.randomUUID(), fields: [field] });

export function createCustomField(type: CustomFieldType): FormField {
  return { id: crypto.randomUUID(), label: CUSTOM_TYPE_LABEL[type], kind: 'custom', type };
}

export const flattenFields = (settings: FormSettings): FormField[] =>
  settings.rows.flatMap((row) => row.fields);

export function fieldTypeLabel(field: FormField): string {
  if (field.kind === 'custom') return CUSTOM_TYPE_LABEL[field.type];
  const labels = {
    title: 'Text',
    description: 'Text area',
    status: 'Select',
    priority: 'Select',
    dueDate: 'Date',
    tags: 'Tags',
  } as const;
  return labels[field.key];
}

function insertField(rows: FormRow[], field: FormField, target: DropTarget): FormRow[] {
  if (target.kind === 'slot') {
    const row = rows.find((r) => r.id === target.rowId);
    if (row && row.fields.length < MAX_COLUMNS) {
      return rows.map((r) => (r === row ? { ...r, fields: [...r.fields, field] } : r));
    }
  }
  if (target.kind === 'gap' && target.beforeRowId !== null) {
    const index = rows.findIndex((r) => r.id === target.beforeRowId);
    if (index !== -1) return [...rows.slice(0, index), rowOf(field), ...rows.slice(index)];
  }
  return [...rows, rowOf(field)]; // default: appended at the end of the form
}

/** Adds a new field (e.g. from the palette). Without a target it goes to the end of the form. */
export function addField(settings: FormSettings, field: FormField, target: DropTarget = END): FormSettings {
  return { rows: insertField(settings.rows, field, target) };
}

/** Moves an existing field. Invalid drops (full row, own row) leave the settings untouched. */
export function moveField(settings: FormSettings, fieldId: string, target: DropTarget): FormSettings {
  const rows = settings.rows;
  const sourceRow = rows.find((r) => r.fields.some((f) => f.id === fieldId));
  const field = sourceRow?.fields.find((f) => f.id === fieldId);
  if (!sourceRow || !field) return settings;

  if (target.kind === 'swap') {
    if (target.fieldId === fieldId) return settings;
    const other = flattenFields(settings).find((f) => f.id === target.fieldId);
    if (!other) return settings;
    return {
      rows: rows.map((r) => ({
        ...r,
        fields: r.fields.map((f) => (f.id === fieldId ? other : f.id === target.fieldId ? field : f)),
      })),
    };
  }

  if (target.kind === 'slot') {
    const targetRow = rows.find((r) => r.id === target.rowId);
    if (!targetRow || targetRow.id === sourceRow.id || targetRow.fields.length >= MAX_COLUMNS) return settings;
  }

  // Remove first but keep the (possibly empty) source row while inserting, so a gap that
  // references it still resolves; empty rows are dropped at the end.
  const without = rows.map((r) =>
    r.id === sourceRow.id ? { ...r, fields: r.fields.filter((f) => f.id !== fieldId) } : r,
  );
  return { rows: insertField(without, field, target).filter((r) => r.fields.length > 0) };
}

/** Removes a custom field. Built-in fields cannot be removed. */
export function removeField(settings: FormSettings, fieldId: string): FormSettings {
  const field = flattenFields(settings).find((f) => f.id === fieldId);
  if (!field || field.kind === 'builtin') return settings;
  return {
    rows: settings.rows
      .map((r) => ({ ...r, fields: r.fields.filter((f) => f.id !== fieldId) }))
      .filter((r) => r.fields.length > 0),
  };
}

export function renameField(settings: FormSettings, fieldId: string, label: string): FormSettings {
  return {
    rows: settings.rows.map((r) => ({
      ...r,
      fields: r.fields.map((f) => (f.id === fieldId ? { ...f, label } : f)),
    })),
  };
}
