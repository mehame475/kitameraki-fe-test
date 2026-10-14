export const BUILTIN_FIELD_KEYS = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'] as const;
export type BuiltinFieldKey = (typeof BUILTIN_FIELD_KEYS)[number];

export const CUSTOM_FIELD_TYPES = ['text', 'date', 'datetime', 'email'] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export const CUSTOM_TYPE_LABEL: Record<CustomFieldType, string> = {
  text: 'Text',
  date: 'Date',
  datetime: 'Date and Time',
  email: 'Email',
};

// A field on the task form. Built-in fields can be renamed and moved, but not removed
export type FormField = { id: string; label: string } & (
  | { kind: 'builtin'; key: BuiltinFieldKey }
  | { kind: 'custom'; type: CustomFieldType }
);

// One visual row of the form: one or two columns
export interface FormRow {
  id: string;
  fields: FormField[];
}

export interface FormSettings {
  rows: FormRow[];
}

export const MAX_COLUMNS = 2;
export const LABEL_MAX_LENGTH = 100;

const builtin = (key: BuiltinFieldKey, label: string): FormField => ({ id: key, label, kind: 'builtin', key });

// Layout used until an organization saves its own settings (mirrors the Part 1 form)
export const DEFAULT_FORM_SETTINGS: FormSettings = {
  rows: [
    { id: 'row-title', fields: [builtin('title', 'Title')] },
    { id: 'row-description', fields: [builtin('description', 'Description')] },
    { id: 'row-status', fields: [builtin('status', 'Status'), builtin('priority', 'Priority')] },
    { id: 'row-due', fields: [builtin('dueDate', 'Due date'), builtin('tags', 'Tags')] },
  ],
};
