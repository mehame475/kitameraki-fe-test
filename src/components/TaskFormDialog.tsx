import { useState, type FormEvent } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Select,
  Textarea,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from '../types/task';

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingHorizontalM },
});

const MAX_TITLE = 120;
const MAX_DESCRIPTION = 1000;

const EMPTY: TaskInput = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
};

interface Props {
  /** Pass a task to edit it; omit to create a new one. */
  task?: Task;
  onSubmit: (input: TaskInput) => Promise<void>;
  onClose: () => void;
}

/**
 * Mount this component only while the dialog should be visible; its form state
 * is initialised from `task` on mount, so no reset logic is needed.
 */
export function TaskFormDialog({ task, onSubmit, onClose }: Props) {
  const styles = useStyles();
  const [values, setValues] = useState<TaskInput>(
    task
      ? {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        }
      : EMPTY,
  );
  const [titleError, setTitleError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const title = values.title.trim();
    if (!title) {
      setTitleError('Title is required.');
      return;
    }
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await onSubmit({ ...values, title, description: values.description.trim() });
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save the task.');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open modalType="modal" onOpenChange={(_, data) => !data.open && !submitting && onClose()}>
      <DialogSurface>
        <form onSubmit={handleSubmit} noValidate>
          <DialogBody>
            <DialogTitle>{task ? 'Edit task' : 'Add task'}</DialogTitle>
            <DialogContent className={styles.form}>
              {submitError && (
                <MessageBar intent="error">
                  <MessageBarBody>{submitError}</MessageBarBody>
                </MessageBar>
              )}

              <Field
                label="Title"
                required
                validationState={titleError ? 'error' : 'none'}
                validationMessage={titleError}
              >
                <Input
                  value={values.title}
                  maxLength={MAX_TITLE}
                  autoFocus
                  onChange={(_, data) => {
                    set('title', data.value);
                    if (titleError) setTitleError(undefined);
                  }}
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={values.description}
                  maxLength={MAX_DESCRIPTION}
                  resize="vertical"
                  onChange={(_, data) => set('description', data.value)}
                />
              </Field>

              <div className={styles.row}>
                <Field label="Status">
                  <Select
                    value={values.status}
                    onChange={(_, data) => set('status', data.value as TaskStatus)}
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select
                    value={values.priority}
                    onChange={(_, data) => set('priority', data.value as TaskPriority)}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_LABEL[p]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Due date">
                <Input
                  type="date"
                  value={values.dueDate}
                  onChange={(_, data) => set('dueDate', data.value)}
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button appearance="primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : task ? 'Save changes' : 'Add task'}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}
