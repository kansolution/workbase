import path from 'node:path';
import { Plugin } from '@nocobase/server';
import { registerCycleAutoGeneration } from './cycle-schedule';
import { registerTaskCheckinAutoGeneration } from './task-checkin-schedule';

export class CompanyManagementPlugin extends Plugin {
  async load() {
    await this.importCollections(path.resolve(__dirname, '../../collections'));
    registerCycleAutoGeneration(this);
    registerTaskCheckinAutoGeneration(this);
  }
}

export default CompanyManagementPlugin;
