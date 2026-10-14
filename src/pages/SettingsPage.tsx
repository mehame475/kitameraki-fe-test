import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  Spinner,
  Text,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { FieldProperties } from '../components/FieldProperties';
import { FormBuilder } from '../components/FormBuilder';
import { useFormSettings } from '../hooks/useFormSettings';
import type { FormSettings } from '../types/formSettings';
import { flattenFields, removeField, renameField } from '../utils/formLayout';

const useStyles = makeStyles({
  page: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS },
  loading: { padding: tokens.spacingVerticalXXXL },
});

export default function SettingsPage() {
  const styles = useStyles();
  const { settings, loading, error, save, reload } = useFormSettings();

  const [draft, setDraft] = useState<FormSettings | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [saved, setSaved] = useState(false);

  // Start editing from whatever was loaded (or saved) last
  useEffect(() => {
    if (!loading) setDraft(settings);
  }, [loading, settings]);

  const dirty = useMemo(
    () => draft !== null && JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings],
  );
  const fields = useMemo(() => (draft ? flattenFields(draft) : []), [draft]);
  const selected = fields.find((f) => f.id === selectedId);
  const hasEmptyLabel = fields.some((f) => f.label.trim() === '');

  const edit = (next: FormSettings) => {
    setDraft(next);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      await save({
        rows: draft.rows.map((row) => ({
          ...row,
          fields: row.fields.map((f) => ({ ...f, label: f.label.trim() })),
        })),
      });
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save the form settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft(settings);
    setSelectedId(null);
    setSaved(false);
    setSaveError(undefined);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Title3 as="h2">Task form</Title3>
          <br />
          <Text>
            Arrange the fields of the task form (up to two columns per row). The task list and the
            add-task form follow this layout.
          </Text>
        </div>
        <div className={styles.actions}>
          <Button appearance="secondary" disabled={!dirty || saving} onClick={handleDiscard}>
            Discard changes
          </Button>
          <Button
            appearance="primary"
            disabled={!dirty || saving || hasEmptyLabel}
            onClick={() => void handleSave()}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
          <MessageBarActions>
            <Button onClick={() => void reload()}>Retry</Button>
          </MessageBarActions>
        </MessageBar>
      )}
      {saveError && (
        <MessageBar intent="error">
          <MessageBarBody>{saveError}</MessageBarBody>
        </MessageBar>
      )}
      {saved && !dirty && (
        <MessageBar intent="success">
          <MessageBarBody>Form settings saved. They now apply to all tasks.</MessageBarBody>
        </MessageBar>
      )}

      {loading || !draft ? (
        <Spinner className={styles.loading} label="Loading form settings…" />
      ) : (
        <FormBuilder
          settings={draft}
          onChange={edit}
          selectedId={selectedId}
          onSelect={setSelectedId}
          sidePanel={
            <FieldProperties
              field={selected}
              onRename={(label) => selected && edit(renameField(draft, selected.id, label))}
              onDelete={() => {
                if (!selected) return;
                edit(removeField(draft, selected.id));
                setSelectedId(null);
              }}
            />
          }
        />
      )}
    </div>
  );
}
