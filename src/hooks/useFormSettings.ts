import { useCallback, useEffect, useState } from 'react';
import { formSettingsApi } from '../services/formSettingsApi';
import { DEFAULT_FORM_SETTINGS, type FormSettings } from '../types/formSettings';

interface UseFormSettings {
  settings: FormSettings;
  loading: boolean;
  error: string | null;
  // Persists and adopts the new settings; rejects so callers can show the error
  save: (next: FormSettings) => Promise<void>;
  reload: () => Promise<void>;
}

export function useFormSettings(): UseFormSettings {
  const [settings, setSettings] = useState<FormSettings>(DEFAULT_FORM_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings((await formSettingsApi.get()) ?? DEFAULT_FORM_SETTINGS);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the form settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(async (next: FormSettings) => {
    setSettings(await formSettingsApi.save(next));
  }, []);

  return { settings, loading, error, save, reload };
}
