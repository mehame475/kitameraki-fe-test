import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  Spinner,
  Title2,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { DeleteTaskDialog } from './components/DeleteTaskDialog';
import { Pagination } from './components/Pagination';
import { TaskFormDialog } from './components/TaskFormDialog';
import { TaskTable } from './components/TaskTable';
import { TaskToolbar } from './components/TaskToolbar';
import { useDebounce } from './hooks/useDebounce';
import { useTasks } from './hooks/useTasks';
import type { Task, TaskStatus } from './types/task';
import { DEFAULT_FILTERS, filterTasks, pageCount, paginate, type TaskFilters } from './utils/taskView';

const useStyles = makeStyles({
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXL}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  loading: { padding: tokens.spacingVerticalXXXL },
});

type DialogState =
  | { type: 'none' }
  | { type: 'form' }
  | { type: 'delete'; task: Task };

export default function App() {
  const styles = useStyles();
  const { tasks, loading, error, createTask, updateTask, deleteTask, reload } = useTasks();

  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' });
  const [actionError, setActionError] = useState<string>();

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

  // Go back to the first page whenever the result set changes shape.
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
    <main className={styles.page}>
      <Title2 as="h1">Tasks</Title2>

      <TaskToolbar
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        onAdd={() => setDialog({ type: 'form' })}
      />

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
          <MessageBarActions>
            <Button onClick={() => void reload()}>Retry</Button>
          </MessageBarActions>
        </MessageBar>
      )}
      {actionError && (
        <MessageBar intent="error">
          <MessageBarBody>{actionError}</MessageBarBody>
        </MessageBar>
      )}

      {loading ? (
        <Spinner className={styles.loading} label="Loading tasks…" />
      ) : (
        <>
          <TaskTable
            tasks={visible}
            onStatusChange={handleStatusChange}
            onSave={(task, patch) => updateTask(task.id, patch)}
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

      {dialog.type === 'form' && (
        <TaskFormDialog onClose={closeDialog} onSubmit={createTask} />
      )}
      {dialog.type === 'delete' && (
        <DeleteTaskDialog
          task={dialog.task}
          onClose={closeDialog}
          onConfirm={() => deleteTask(dialog.task.id)}
        />
      )}
    </main>
  );
}