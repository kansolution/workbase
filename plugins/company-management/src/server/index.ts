import path from 'node:path';
import { Plugin } from '@nocobase/server';
import { registerCycleAutoGeneration } from './cycle-schedule';
import { registerTaskCheckinAutoGeneration } from './task-checkin-schedule';

/** Collections that should be visible/editable in Settings > Data sources > Collections. */
const UI_MANAGEABLE_COLLECTIONS = [
  'departments',
  'teams',
  'product_groups',
  'cycles',
  'tasks',
  'task_checkins',
  'projects',
  'objectives',
  'key_results',
];

export class CompanyManagementPlugin extends Plugin {
  async load() {
    // `Plugin.importCollections()` is a deprecated no-op in this NocoBase
    // version; `db.import()` is the real API, and newly registered
    // collections still need an explicit sync since this plugin is loaded
    // (and its collections registered) after the framework's own
    // enable-time `db.sync()` has already run.
    await this.db.import({ directory: path.resolve(__dirname, '../../collections') });
    await this.db.sync();

    // `uiManageable: true` on a collection's JSON only gets read by
    // @nocobase/plugin-data-source-main's afterEnablePlugin/afterUpgrade
    // listeners, which run before this plugin's own load() has defined
    // these collections -- so their auto-sync into the collection-manager
    // metadata (Settings > Data sources UI) misses them. Trigger it here
    // explicitly instead, so it doesn't depend on that event ordering.
    //
    // db2cm() is a no-op once a collection's metadata row already exists,
    // so it never picks up fields added *after* the first sync (e.g. the
    // `sort` field added later for Kanban drag-and-drop) -- backfill any
    // missing field rows for those ourselves too.
    const collectionsRepo = this.db.getRepository('collections') as any;
    const fieldsRepo = this.db.getRepository('fields') as any;
    for (const name of UI_MANAGEABLE_COLLECTIONS) {
      const alreadySynced = await collectionsRepo.findOne({ filter: { name } });
      if (!alreadySynced) {
        if (typeof collectionsRepo?.db2cmCollections === 'function') {
          await collectionsRepo.db2cmCollections([name]);
        }
        continue;
      }
      const collection = this.db.getCollection(name);
      for (const [fieldName, field] of collection.fields) {
        const fieldSynced = await fieldsRepo.findOne({ filter: { collectionName: name, name: fieldName } });
        if (!fieldSynced) {
          await fieldsRepo.create({ values: { collectionName: name, name: fieldName, ...field.options } });
        }
      }
    }

    registerCycleAutoGeneration(this as any);
    registerTaskCheckinAutoGeneration(this as any);
  }
}

export default CompanyManagementPlugin;
