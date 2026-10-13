# Task Manager — Client (Part 1)

React 18 + TypeScript + Fluent UI v9 (Vite).

## Run locally

```bash
npm install
cp .env.example .env     # optional
npm run dev              # http://localhost:5173
```

- **Without a back-end:** leave `VITE_API_URL` empty. The app uses a localStorage mock API seeded with sample tasks.
- **With the Azure Functions back-end:** set `VITE_API_URL` (e.g. `http://localhost:7071/api`) and make sure CORS allows `http://localhost:5173`.

## Expected API

| Method | Path         | Body        | Response |
| ------ | ------------ | ----------- | -------- |
| GET    | `/tasks`     | –           | `Task[]` |
| POST   | `/tasks`     | `TaskInput` | `Task`   |
| PATCH  | `/tasks/:id` | `TaskPatch` | `Task`   |
| DELETE | `/tasks/:id` | –           | `204`    |

Task shape: see `src/types/task.ts`. If the back-end differs, only `src/services/taskApi.ts` needs to change.

## Scripts

`npm run build` · `npm run typecheck` · `npm test`

## Structure

```
src/
  components/   TaskToolbar, TaskTable, TaskFormDialog, DeleteTaskDialog, Pagination
  hooks/        useTasks (data + mutations), useDebounce
  services/     taskApi (HTTP client + localStorage mock)
  utils/        taskView (filter / paginate / format) + tests
  types/        Task models and label maps
```
