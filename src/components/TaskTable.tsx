import { useState } from 'react';
import {
  Badge,
  Button,
  Input,
  MessageBar,
  MessageBarBody,
  Select,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  makeStyles,
  tokens,
  type BadgeProps,
} from '@fluentui/react-components';
import { CheckmarkRegular, DeleteRegular, DismissRegular, EditRegular } from '@fluentui/react-icons';
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskPatch,
  type TaskPriority,
  type TaskStatus,
} from '../types/task';
import { formatDate } from '../utils/taskView';

const PRIORITY_COLOR: Record<TaskPriority, BadgeProps['color']> = {
  low: 'informative',
  medium: 'warning',
  high: 'danger',
};

const useStyles = makeStyles({
  wrapper: { overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  description: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    whiteSpace: 'normal',
  },
  editing: { backgroundColor: tokens.colorNeutralBackground1Selected },
  fill: { width: '100%' },
  actions: { display: 'flex', whiteSpace: 'nowrap' },
  empty: {
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalL}`,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

interface Props {
  tasks: Task[];
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onSave: (task: Task, patch: TaskPatch) => Promise<void>;
  onDelete: (task: Task) => void;
}

const toDraft = (t: Task): TaskInput => ({
  title: t.title,
  description: t.description,
  status: t.status,
  priority: t.priority,
  dueDate: t.dueDate,
});

export function TaskTable({ tasks, onStatusChange, onSave, onDelete }: Props) {
  const styles = useStyles();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setDraft(toDraft(task));
    setError(undefined);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
    setError(undefined);
  };

  const saveEdit = async (task: Task) => {
    if (!draft || !draft.title.trim()) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSave(task, {
        ...draft,
        title: draft.title.trim(),
        description: draft.description.trim(),
      });
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the task.');
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  if (tasks.length === 0) {
    return (
      <div className={styles.empty}>
        <Text>No tasks match your filters. Adjust the search or add a new task.</Text>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      <Table aria-label="Tasks" size="medium">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Title</TableHeaderCell>
            <TableHeaderCell>Description</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Priority</TableHeaderCell>
            <TableHeaderCell>Due date</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const isEditing = editingId === task.id && draft !== null;

            if (isEditing) {
              return (
                <TableRow
                  key={task.id}
                  className={styles.editing}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') cancelEdit();
                    if (e.key === 'Enter' && !saving) void saveEdit(task);
                  }}
                >
                  <TableCell>
                    <Input
                      className={styles.fill}
                      size="small"
                      aria-label="Title"
                      autoFocus
                      value={draft.title}
                      maxLength={120}
                      aria-invalid={!draft.title.trim()}
                      onChange={(_, d) => setField('title', d.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className={styles.fill}
                      size="small"
                      aria-label="Description"
                      value={draft.description}
                      maxLength={1000}
                      onChange={(_, d) => setField('description', d.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      aria-label="Status"
                      value={draft.status}
                      onChange={(_, d) => setField('status', d.value as TaskStatus)}
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      aria-label="Priority"
                      value={draft.priority}
                      onChange={(_, d) => setField('priority', d.value as TaskPriority)}
                    >
                      {TASK_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {PRIORITY_LABEL[p]}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      size="small"
                      type="date"
                      aria-label="Due date"
                      value={draft.dueDate}
                      onChange={(_, d) => setField('dueDate', d.value)}
                    />
                  </TableCell>
                  <TableCell>{formatDate(task.createdAt)}</TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      <Button
                        appearance="primary"
                        size="small"
                        icon={<CheckmarkRegular />}
                        aria-label="Save changes"
                        disabled={saving || !draft.title.trim()}
                        onClick={() => void saveEdit(task)}
                      />
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<DismissRegular />}
                        aria-label="Cancel editing"
                        disabled={saving}
                        onClick={cancelEdit}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            }

            return (
              <TableRow key={task.id}>
                <TableCell>
                  <TableCellLayout truncate>
                    <Text weight="semibold">{task.title}</Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <div className={styles.description}>{task.description || '—'}</div>
                </TableCell>
                <TableCell>
                  <Select
                    aria-label={`Status of ${task.title}`}
                    size="small"
                    value={task.status}
                    onChange={(_, data) => onStatusChange(task, data.value as TaskStatus)}
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge appearance="tint" color={PRIORITY_COLOR[task.priority]}>
                    {PRIORITY_LABEL[task.priority]}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(task.dueDate)}</TableCell>
                <TableCell>{formatDate(task.createdAt)}</TableCell>
                <TableCell>
                  <div className={styles.actions}>
                    <Button
                      appearance="subtle"
                      icon={<EditRegular />}
                      aria-label={`Edit ${task.title}`}
                      onClick={() => startEdit(task)}
                    />
                    <Button
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      aria-label={`Delete ${task.title}`}
                      onClick={() => onDelete(task)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}