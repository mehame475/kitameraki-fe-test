import { useState } from 'react';
import {
  Button,
  MessageBar,
  MessageBarBody,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { CheckmarkRegular, DeleteRegular, DismissRegular, EditRegular } from '@fluentui/react-icons';
import type { FormField } from '../types/formSettings';
import { STATUS_LABEL, TASK_STATUSES, type Task, type TaskInput, type TaskStatus } from '../types/task';
import { fromDraft, toDraft, validateDraft, type TaskDraft } from '../utils/taskDraft';
import { FieldControl, FieldValue } from './taskFields';

const useStyles = makeStyles({
  wrapper: { overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  editing: { backgroundColor: tokens.colorNeutralBackground1Selected },
  actions: { display: 'flex', whiteSpace: 'nowrap' },
  empty: {
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalL}`,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

interface Props {
  // Columns follow the form settings (row by row, left to right)
  fields: FormField[];
  tasks: Task[];
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onSave: (task: Task, input: TaskInput) => Promise<void>;
  onDelete: (task: Task) => void;
}

export function TaskTable({ fields, tasks, onStatusChange, onSave, onDelete }: Props) {
  const styles = useStyles();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskDraft | null>(null);
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
    if (!draft) return;
    const problems = Object.values(validateDraft(draft, fields));
    if (problems.length > 0) {
      setError(problems.join(' '));
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await onSave(task, fromDraft(draft, fields));
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the task.');
    } finally {
      setSaving(false);
    }
  };

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
            {fields.map((field) => (
              <TableHeaderCell key={field.id}>{field.label}</TableHeaderCell>
            ))}
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const isEditing = editingId === task.id && draft !== null;

            return (
              <TableRow
                key={task.id}
                className={isEditing ? styles.editing : undefined}
                onKeyDown={
                  isEditing
                    ? (e) => {
                        if (e.key === 'Escape') cancelEdit();
                        if (e.key === 'Enter' && !saving) void saveEdit(task);
                      }
                    : undefined
                }
              >
                {fields.map((field) => (
                  <TableCell key={field.id}>
                    {isEditing ? (
                      <FieldControl
                        compact
                        field={field}
                        draft={draft}
                        onChange={(changes) => setDraft((prev) => (prev ? { ...prev, ...changes } : prev))}
                      />
                    ) : field.kind === 'builtin' && field.key === 'status' ? (
                      <Select
                        size="small"
                        aria-label={`${field.label} of ${task.title}`}
                        value={task.status}
                        onChange={(_, data) => onStatusChange(task, data.value as TaskStatus)}
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <FieldValue field={field} task={task} />
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <div className={styles.actions}>
                    {isEditing ? (
                      <>
                        <Button
                          appearance="primary"
                          size="small"
                          icon={<CheckmarkRegular />}
                          aria-label="Save changes"
                          disabled={saving}
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
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
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
