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
    const collectionsRepo = this.db.getRepository('collections') as any;
    if (typeof collectionsRepo?.db2cmCollections === 'function') {
      await collectionsRepo.db2cmCollections(UI_MANAGEABLE_COLLECTIONS);
    }

    registerCycleAutoGeneration(this as any);
    registerTaskCheckinAutoGeneration(this as any);
  }
}

export default CompanyManagementPlugin;
