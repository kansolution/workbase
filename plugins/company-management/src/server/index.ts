import path from 'node:path';
import { Plugin } from '@nocobase/server';
import { registerCycleAutoGeneration } from './cycle-schedule';
import { registerTaskCheckinAutoGeneration } from './task-checkin-schedule';

export class CompanyManagementPlugin extends Plugin {
  async load() {
    // `Plugin.importCollections()` is a deprecated no-op in this NocoBase
    // version; `db.import()` is the real API, and newly registered
    // collections still need an explicit sync since this plugin is loaded
    // (and its collections registered) after the framework's own
    // enable-time `db.sync()` has already run.
    await this.db.import({ directory: path.resolve(__dirname, '../../collections') });
    await this.db.sync();
    registerCycleAutoGeneration(this as any);
    registerTaskCheckinAutoGeneration(this as any);
  }
}

export default CompanyManagementPlugin;
