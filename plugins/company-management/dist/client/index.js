/**
 * Hand-written UMD module (no bundler available in this environment).
 * NocoBase's admin client loads each enabled plugin's dist/client/index.js
 * as a RequireJS/AMD module and expects it to export a `default` class
 * extending `@nocobase/client`'s `Plugin`. This plugin has no client-side
 * UI yet, so it's a no-op placeholder just to satisfy that loader — without
 * it, the whole admin app crashes with a RequireJS "Script error" trying to
 * fetch a dist/client/index.js that doesn't exist.
 *
 * Kept identical to ../../src/client/index.js (the "source"); there's no
 * meaningful build step for a plain hand-written file like this one.
 */
!(function (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory(require('@nocobase/client'));
  } else if (typeof define === 'function' && define.amd) {
    define('company-management', ['@nocobase/client'], factory);
  } else if (typeof exports === 'object') {
    exports['company-management'] = factory(require('@nocobase/client'));
  } else {
    root['company-management'] = factory(root['@nocobase/client']);
  }
})(typeof self !== 'undefined' ? self : this, function (clientLib) {
  class CompanyManagementClientPlugin extends clientLib.Plugin {}
  return { default: CompanyManagementClientPlugin };
});
