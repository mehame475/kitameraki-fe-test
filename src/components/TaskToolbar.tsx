import {
  Button,
  Field,
  SearchBox,
  Select,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { AddRegular, DismissRegular } from '@fluentui/react-icons';
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../types/task';
import type { TaskFilters } from '../utils/taskView';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: tokens.spacingHorizontalM,
  },
  search: { flexGrow: 1, minWidth: '220px', maxWidth: '420px' },
  spacer: { flexGrow: 1 },
});

interface Props {
  filters: TaskFilters;
  hasActiveFilters: boolean;
  onChange: (next: TaskFilters) => void;
  onReset: () => void;
  onAdd: () => void;
}

export function TaskToolbar({ filters, hasActiveFilters, onChange, onReset, onAdd }: Props) {
  const styles = useStyles();

  return (
    <div className={styles.root} role="search">
      <Field label="Search" className={styles.search}>
        <SearchBox
          placeholder="Search title or description"
          value={filters.search}
          onChange={(_, data) => onChange({ ...filters, search: data.value })}
        />
      </Field>

      <Field label="Status">
        <Select
          value={filters.status}
          onChange={(_, data) => onChange({ ...filters, status: data.value as TaskStatus | 'all' })}
        >
          <option value="all">All statuses</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Priority">
        <Select
          value={filters.priority}
          onChange={(_, data) =>
            onChange({ ...filters, priority: data.value as TaskPriority | 'all' })
          }
        >
          <option value="all">All priorities</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </Select>
      </Field>

      {hasActiveFilters && (
        <Button appearance="subtle" icon={<DismissRegular />} onClick={onReset}>
          Clear filters
        </Button>
      )}

      <div className={styles.spacer} />

      <Button appearance="primary" icon={<AddRegular />} onClick={onAdd}>
        Add task
      </Button>
    </div>
  );
}
