import type { FormSettings } from '../types/formSettings';
import { http, HttpError, type HttpClient } from './http';

export interface FormSettingsApi {
  // Resolves to `null` when the organization has not customised its form yet
  get(): Promise<FormSettings | null>;
  save(settings: FormSettings): Promise<FormSettings>;
}

const PATH = '/settings/task-form';

class HttpFormSettingsApi implements FormSettingsApi {
  constructor(private readonly http: HttpClient) {}

  async get() {
    try {
      return await this.http.request<FormSettings>(PATH, 'GET');
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) return null;
      throw error;
    }
  }

  save(settings: FormSettings) {
    return this.http.request<FormSettings>(PATH, 'PUT', settings);
  }
}

const STORAGE_KEY = 'task-manager:form-settings';

// Local mock used when no API is configured
class LocalFormSettingsApi implements FormSettingsApi {
  async get() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as FormSettings) : null;
    } catch {
      return null;
    }
  }

  async save(settings: FormSettings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return settings;
  }
}

export const formSettingsApi: FormSettingsApi = http
  ? new HttpFormSettingsApi(http)
  : new LocalFormSettingsApi();
