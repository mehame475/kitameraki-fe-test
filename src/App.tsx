import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Tab, TabList, Title2, makeStyles, tokens } from '@fluentui/react-components';
import SettingsPage from './pages/SettingsPage';
import TasksPage from './pages/TasksPage';

const useStyles = makeStyles({
  shell: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXL}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
});

export default function App() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <main className={styles.shell}>
      <Title2 as="h1">Task Manager</Title2>

      <TabList
        selectedValue={pathname.startsWith('/settings') ? '/settings' : '/'}
        onTabSelect={(_, data) => navigate(String(data.value))}
      >
        <Tab value="/">Tasks</Tab>
        <Tab value="/settings">Form settings</Tab>
      </TabList>

      <Routes>
        <Route path="/" element={<TasksPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
