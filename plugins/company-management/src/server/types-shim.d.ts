/**
 * `@nocobase/server` is provided at runtime by the host NocoBase app (resolved
 * via Node's module lookup walking up to /app/nocobase/node_modules) but isn't
 * installed as a local dependency here, so there are no type declarations to
 * check against. Declaring it loosely lets tsc compile without pulling in the
 * whole NocoBase monorepo just for types.
 */
declare module '@nocobase/server';
