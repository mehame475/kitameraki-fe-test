import { Button, Field, Input, Text, makeStyles, tokens } from '@fluentui/react-components';
import { DeleteRegular } from '@fluentui/react-icons';
import { LABEL_MAX_LENGTH, type FormField } from '../types/formSettings';
import { fieldTypeLabel } from '../utils/formLayout';

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  hint: { color: tokens.colorNeutralForeground3 },
});

interface Props {
  field: FormField | undefined;
  onRename: (label: string) => void;
  onDelete: () => void;
}

// Right-hand panel of the form builder: edits the selected field
export function FieldProperties({ field, onRename, onDelete }: Props) {
  const styles = useStyles();

  if (!field) {
    return <Text className={styles.hint}>Select a field on the form to edit its properties.</Text>;
  }

  const emptyLabel = field.label.trim() === '';

  return (
    <div className={styles.root}>
      <Field
        label="Field label"
        required
        validationState={emptyLabel ? 'error' : 'none'}
        validationMessage={emptyLabel ? 'A label is required.' : undefined}
      >
        <Input
          value={field.label}
          maxLength={LABEL_MAX_LENGTH}
          onChange={(_, data) => onRename(data.value)}
        />
      </Field>

      <Field label="Field type">
        <Text>
          {fieldTypeLabel(field)}
          {field.kind === 'builtin' ? ' (built-in)' : ''}
        </Text>
      </Field>

      {field.kind === 'custom' ? (
        <Button appearance="outline" icon={<DeleteRegular />} onClick={onDelete}>
          Remove field
        </Button>
      ) : (
        <Text size={200} className={styles.hint}>
          Built-in fields can be renamed and moved, but not removed.
        </Text>
      )}
    </div>
  );
}
