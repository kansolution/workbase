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

## Planned modules (see [`../../docs`](../../docs))

- OKR (Objectives & Key Results)
- KPI tracking
- Task management
- Project / Dự án
- Strategy Hub
