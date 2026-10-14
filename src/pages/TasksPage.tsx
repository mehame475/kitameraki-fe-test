import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { DeleteTaskDialog } from '../components/DeleteTaskDialog';
import { Pagination } from '../components/Pagination';
import { TaskFormDialog } from '../components/TaskFormDialog';
import { TaskTable } from '../components/TaskTable';
import { TaskToolbar } from '../components/TaskToolbar';
import { useDebounce } from '../hooks/useDebounce';
import { useFormSettings } from '../hooks/useFormSettings';
import { useTasks } from '../hooks/useTasks';
import type { Task, TaskStatus } from '../types/task';
import { flattenFields } from '../utils/formLayout';
import { DEFAULT_FILTERS, filterTasks, pageCount, paginate, type TaskFilters } from '../utils/taskView';

const useStyles = makeStyles({
  page: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  loading: { padding: tokens.spacingVerticalXXXL },
});

type DialogState = { type: 'none' } | { type: 'add' } | { type: 'delete'; task: Task };

export default function TasksPage() {
  const styles = useStyles();
  const { tasks, loading, error, createTask, updateTask, deleteTask, reload } = useTasks();
  const { settings, loading: settingsLoading, error: settingsError } = useFormSettings();

  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' });
  const [actionError, setActionError] = useState<string>();

  const fields = useMemo(() => flattenFields(settings), [settings]);

  const debouncedSearch = useDebounce(filters.search);
  const effectiveFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const filtered = useMemo(() => filterTasks(tasks, effectiveFilters), [tasks, effectiveFilters]);
  const totalPages = pageCount(filtered.length, pageSize);
  const currentPage = Math.min(page, totalPages);
  const visible = useMemo(
    () => paginate(filtered, currentPage, pageSize),
    [filtered, currentPage, pageSize],
  );

  // Go back to the first page whenever the result set changes shape
  useEffect(() => setPage(1), [effectiveFilters, pageSize]);

  const hasActiveFilters =
    filters.search !== '' || filters.status !== 'all' || filters.priority !== 'all';

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    setActionError(undefined);
    try {
      await updateTask(task.id, { status });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not update the status.');
    }
  };

  const closeDialog = () => setDialog({ type: 'none' });

  return (
    <div className={styles.page}>
      <TaskToolbar
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        onAdd={() => setDialog({ type: 'add' })}
      />

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
          <MessageBarActions>
            <Button onClick={() => void reload()}>Retry</Button>
          </MessageBarActions>
        </MessageBar>
      )}
      {settingsError && (
        <MessageBar intent="warning">
          <MessageBarBody>
            Could not load the form settings, so the default form is shown. {settingsError}
          </MessageBarBody>
        </MessageBar>
      )}
      {actionError && (
        <MessageBar intent="error">
          <MessageBarBody>{actionError}</MessageBarBody>
        </MessageBar>
      )}

      {loading || settingsLoading ? (
        <Spinner className={styles.loading} label="Loading tasks…" />
      ) : (
        <>
          <TaskTable
            fields={fields}
            tasks={visible}
            onStatusChange={handleStatusChange}
            onSave={(task, input) => updateTask(task.id, input)}
            onDelete={(task) => setDialog({ type: 'delete', task })}
          />
          <Pagination
            page={currentPage}
            pageSize={pageSize}
            totalItems={filtered.length}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {dialog.type === 'add' && (
        <TaskFormDialog settings={settings} onClose={closeDialog} onSubmit={createTask} />
      )}
      {dialog.type === 'delete' && (
        <DeleteTaskDialog
          task={dialog.task}
          onClose={closeDialog}
          onConfirm={() => deleteTask(dialog.task.id)}
        />
      )}
    </div>
  );
}
