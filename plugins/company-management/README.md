# company-management (NocoBase plugin)

Custom plugin cho hệ thống quản lý công việc/đội ngũ của công ty: OKR, KPI,
Task, Dự án, Strategy Hub.

This directory is bind-mounted into the NocoBase container at
`/app/nocobase/storage/plugins/company-management` (see
[`../../app/docker-compose.yml`](../../app/docker-compose.yml)), so anything
scaffolded here is picked up by NocoBase as a **local plugin**.

## Scaffolding the plugin

The plugin skeleton itself must be generated from inside the running
container using the NocoBase CLI (it depends on the exact NocoBase version's
generator, so it's not hand-written here). Once the stack is up:

```bash
docker compose exec app yarn nocobase --help
```

Look for the plugin-creation command for your installed version (e.g.
`create-plugin` / `pm create`) and target this package name:
`company-management`, output path
`storage/plugins/company-management`.

After scaffolding, enable the plugin from **Plugin Manager** in the NocoBase
UI.

## Collections & server logic already written

- [`collections/`](collections) — JSON collection definitions for the
  "Tổ chức & Con người" group (`departments`, `teams`, `product_groups`,
  `cycles`, plus an extension of the built-in `users` collection) and the
  "Task" group (`tasks`, `task_checkins`). See
  [`collections/README.md`](collections/README.md) for how to wire them in
  via `this.importCollections()` once the plugin skeleton exists, and for a
  note on the `tasks.project → projects` dependency (`projects` is created in
  a later session).
- [`src/server/generate-cycles.ts`](src/server/generate-cycles.ts) and
  [`src/server/cycle-schedule.ts`](src/server/cycle-schedule.ts) — pure logic
  + wiring to auto-generate `cycles` records (1 Năm → 4 Quý → 12 Tháng → ISO
  weeks) at the start of each year, plus a manual `cycles:generate` action for
  testing. Call `registerCycleAutoGeneration(this)` from the plugin's
  `load()` alongside `importCollections()`.
- [`src/server/task-checkin-logic.ts`](src/server/task-checkin-logic.ts) and
  [`src/server/task-checkin-schedule.ts`](src/server/task-checkin-schedule.ts)
  — same pattern, but for the daily 00:05 "Schedule" job that creates
  `task_checkins` for active `Định kỳ` tasks (see the doc comment at the top
  of `task-checkin-logic.ts` for how `recurrence_unit`/`recurrence_frequency`
  are interpreted). Call `registerTaskCheckinAutoGeneration(this)` from
  `load()` the same way.
- [`docs/tasks-page-setup.md`](docs/tasks-page-setup.md) — step-by-step guide
  for building the "Công việc của tôi" page (Kanban/Calendar/Table/Form
  blocks for `tasks`, Calendar/Kanban for `task_checkins`, and the
  `pause_reason` linkage rule) through the Admin UI, since pages/blocks are
  runtime UI Schema config in NocoBase, not something `importCollections()`
  can declare.

## Planned modules (see [`../../docs`](../../docs))

- OKR (Objectives & Key Results)
- KPI tracking
- Task management
- Project / Dự án
- Strategy Hub
