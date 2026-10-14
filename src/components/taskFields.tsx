import { Badge, Input, Select, Textarea, Text, makeStyles, tokens, type BadgeProps } from '@fluentui/react-components';
import type { FormField } from '../types/formSettings';
import {
  DESCRIPTION_MAX_LENGTH,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TITLE_MAX_LENGTH,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '../types/task';
import { formatCustomValue, fromInputValue, toInputValue, type TaskDraft } from '../utils/taskDraft';
import { formatDate } from '../utils/taskView';

const CUSTOM_VALUE_MAX_LENGTH = 1000;

// editing
interface ControlProps {
  field: FormField;
  draft: TaskDraft;
  onChange: (patch: Partial<TaskDraft>) => void;
  // Compact controls for inline editing inside the table
  compact?: boolean;
}

// The input for one form field. Used by the add-task dialog and by inline row editing
export function FieldControl({ field, draft, onChange, compact = false }: ControlProps) {
  const size = compact ? 'small' : 'medium';
  const ariaLabel = field.label;

  if (field.kind === 'custom') {
    const inputType = { text: 'text', date: 'date', datetime: 'datetime-local', email: 'email' }[field.type] as
      | 'text'
      | 'date'
      | 'datetime-local'
      | 'email';
    return (
      <Input
        size={size}
        type={inputType}
        aria-label={ariaLabel}
        maxLength={field.type === 'text' || field.type === 'email' ? CUSTOM_VALUE_MAX_LENGTH : undefined}
        value={toInputValue(field.type, draft.custom[field.id] ?? '')}
        onChange={(_, data) =>
          onChange({ custom: { ...draft.custom, [field.id]: fromInputValue(field.type, data.value) } })
        }
      />
    );
  }

  switch (field.key) {
    case 'title':
      return (
        <Input
          size={size}
          aria-label={ariaLabel}
          autoFocus
          maxLength={TITLE_MAX_LENGTH}
          value={draft.title}
          onChange={(_, data) => onChange({ title: data.value })}
        />
      );
    case 'description':
      return compact ? (
        <Input
          size={size}
          aria-label={ariaLabel}
          maxLength={DESCRIPTION_MAX_LENGTH}
          value={draft.description}
          onChange={(_, data) => onChange({ description: data.value })}
        />
      ) : (
        <Textarea
          aria-label={ariaLabel}
          resize="vertical"
          maxLength={DESCRIPTION_MAX_LENGTH}
          value={draft.description}
          onChange={(_, data) => onChange({ description: data.value })}
        />
      );
    case 'status':
      return (
        <Select
          size={size}
          aria-label={ariaLabel}
          value={draft.status}
          onChange={(_, data) => onChange({ status: data.value as TaskStatus })}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      );
    case 'priority':
      return (
        <Select
          size={size}
          aria-label={ariaLabel}
          value={draft.priority}
          onChange={(_, data) => onChange({ priority: data.value as TaskPriority })}
        >
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </Select>
      );
    case 'dueDate':
      return (
        <Input
          size={size}
          type="date"
          aria-label={ariaLabel}
          value={draft.dueDate}
          onChange={(_, data) => onChange({ dueDate: data.value })}
        />
      );
    case 'tags':
      return (
        <Input
          size={size}
          aria-label={ariaLabel}
          placeholder="tag1, tag2"
          value={draft.tagsText}
          onChange={(_, data) => onChange({ tagsText: data.value })}
        />
      );
  }
}

// display
const PRIORITY_COLOR: Record<TaskPriority, BadgeProps['color']> = {
  low: 'informative',
  medium: 'warning',
  high: 'danger',
};

const useStyles = makeStyles({
  clamp: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    whiteSpace: 'normal',
  },
  tags: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalXS },
});

// Read-only value of one form field for a task (status is rendered by the table itself)
export function FieldValue({ field, task }: { field: FormField; task: Task }) {
  const styles = useStyles();

  if (field.kind === 'custom') return <>{formatCustomValue(field.type, task.customFields[field.id])}</>;

  switch (field.key) {
    case 'title':
      return <Text weight="semibold">{task.title}</Text>;
    case 'description':
      return <div className={styles.clamp}>{task.description || '-'}</div>;
    case 'status':
      return <>{STATUS_LABEL[task.status]}</>;
    case 'priority':
      return (
        <Badge appearance="tint" color={PRIORITY_COLOR[task.priority]}>
          {PRIORITY_LABEL[task.priority]}
        </Badge>
      );
    case 'dueDate':
      return <>{formatDate(task.dueDate)}</>;
    case 'tags':
      return (
        <div className={styles.tags}>
          {task.tags.length === 0
            ? '-'
            : task.tags.map((tag) => (
                <Badge key={tag} appearance="outline" size="small">
                  {tag}
                </Badge>
              ))}
        </div>
      );
  }
}
