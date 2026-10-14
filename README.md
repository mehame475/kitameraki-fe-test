# Task Manager — Client (Part 1)

React 18 + TypeScript + Fluent UI v9 (Vite).

## Run locally

```bash
npm install
cp .env.example .env     # optional
npm run dev              # http://localhost:5173
```

- **Inline editing:** click the pencil on a row to edit it in place (Enter saves, Esc cancels).
- **Without a back-end:** leave `VITE_API_URL` empty. The app uses a localStorage mock API seeded with sample tasks.
- **With the Azure Functions API** (`kitameraki-be-test`): set in `.env`
  - `VITE_API_URL=http://localhost:7071/api`
  - `VITE_ORGANIZATION_ID=<uuid>` (sent as `x-organization-id`)
  - `VITE_API_KEY=<function key>` (optional; not needed locally)

  The API must allow CORS from `http://localhost:5173` (`Host.CORS` in `local.settings.json`).

## API used

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET | `/tasks` | list for the organization |
| POST | `/tasks` | create |
| PATCH | `/tasks/{id}` | partial update (status, inline edit) |
| DELETE | `/tasks/{id}` | delete |
| GET / PUT | `/settings/task-form` | load / save the form layout (404 = not configured, default form is used) |

The wire format (date-times, optional fields) is mapped to UI types in `src/services/taskApi.ts`.

## Form settings (Part 2)

Open the **Form settings** tab to configure the task form. The page follows the [bpmn.io form builder](https://demo.bpmn.io/form/s/start): field types on the left, the form layout in the middle, properties of the selected field on the right. Drag and drop uses [dnd-kit](https://dndkit.com/).

- **Add a field:** drag Text, Date, Date and Time or Email onto the form, or click it to append it at the end of the form.
- **Arrange:** drag a field to the line between rows (new row), onto the right half of a single-field row (second column; max 2 columns per row) or onto another field (swap). Rows are unlimited.
- **Rename:** select a field and edit its label (works for built-in and custom fields). Custom fields can be removed; built-in fields cannot.
- **Save changes** persists the layout for everyone. The task table columns and the add-task dialog follow it; inline editing uses the same fields.

## Scripts

`npm run build` · `npm run typecheck` · `npm test`

## Structure

```
src/
  pages/        TasksPage, SettingsPage
  components/   TaskToolbar, TaskTable, TaskFormDialog (add), DeleteTaskDialog, Pagination,
                FormBuilder (dnd-kit), FieldProperties, taskFields (field-driven inputs/cells)
  hooks/        useTasks, useFormSettings, useDebounce
  services/     http (shared client), taskApi, formSettingsApi (HTTP + localStorage mocks)
  utils/        taskView (filter / paginate / format), formLayout (builder logic), taskDraft + tests
  types/        Task and form-settings models
```
