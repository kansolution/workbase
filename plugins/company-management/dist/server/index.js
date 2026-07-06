"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyManagementPlugin = void 0;
const node_path_1 = __importDefault(require("node:path"));
const server_1 = require("@nocobase/server");
const cycle_schedule_1 = require("./cycle-schedule");
const task_checkin_schedule_1 = require("./task-checkin-schedule");
class CompanyManagementPlugin extends server_1.Plugin {
    async load() {
        // `Plugin.importCollections()` is a deprecated no-op in this NocoBase
        // version; `db.import()` is the real API, and newly registered
        // collections still need an explicit sync since this plugin is loaded
        // (and its collections registered) after the framework's own
        // enable-time `db.sync()` has already run.
        await this.db.import({ directory: node_path_1.default.resolve(__dirname, '../../collections') });
        await this.db.sync();
        (0, cycle_schedule_1.registerCycleAutoGeneration)(this);
        (0, task_checkin_schedule_1.registerTaskCheckinAutoGeneration)(this);
    }
}
exports.CompanyManagementPlugin = CompanyManagementPlugin;
exports.default = CompanyManagementPlugin;
