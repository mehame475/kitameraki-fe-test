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
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { FormSettings } from '../types/formSettings';
import type { TaskInput } from '../types/task';
import { emptyDraft, fromDraft, validateDraft, type TaskDraft } from '../utils/taskDraft';
import { flattenFields } from '../utils/formLayout';
import { FieldControl } from './taskFields';

const useStyles = makeStyles({
  surface: { maxWidth: '680px', width: '100%' },
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  row: { display: 'grid', gap: tokens.spacingHorizontalM },
});

interface Props {
  // The form layout configured on the settings page
  settings: FormSettings;
  onSubmit: (input: TaskInput) => Promise<void>;
  onClose: () => void;
}

// Add-task dialog. Mount it only while it should be visible (state starts empty on mount)
export function TaskFormDialog({ settings, onSubmit, onClose }: Props) {
  const styles = useStyles();
  const fields = flattenFields(settings);

  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const patch = (changes: Partial<TaskDraft>) => {
    setDraft((prev) => ({ ...prev, ...changes }));
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateDraft(draft, fields);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await onSubmit(fromDraft(draft, fields));
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save the task.');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open modalType="modal" onOpenChange={(_, data) => !data.open && !submitting && onClose()}>
      <DialogSurface className={styles.surface}>
        <form onSubmit={handleSubmit} noValidate>
          <DialogBody>
            <DialogTitle>Add task</DialogTitle>
            <DialogContent className={styles.form}>
              {submitError && (
                <MessageBar intent="error">
                  <MessageBarBody>{submitError}</MessageBarBody>
                </MessageBar>
              )}

              {settings.rows.map((row) => (
                <div
                  key={row.id}
                  className={styles.row}
                  style={{ gridTemplateColumns: `repeat(${row.fields.length}, minmax(0, 1fr))` }}
                >
                  {row.fields.map((field) => (
                    <Field
                      key={field.id}
                      label={field.label}
                      required={field.kind === 'builtin' && field.key === 'title'}
                      validationState={errors[field.id] ? 'error' : 'none'}
                      validationMessage={errors[field.id]}
                    >
                      <FieldControl field={field} draft={draft} onChange={patch} />
                    </Field>
                  ))}
                </div>
              ))}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button appearance="primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Add task'}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}
