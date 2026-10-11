/* Orchestration: shared store (single localStorage blob, same backup-friendly pattern as
 * tools/app_template.html) and demo-mode banner. No theme toggle and no global
 * export/import chrome here (per spec.md: theme toggle excluded for v1 on thin evidence;
 * export/import lives inside the Settings view, not the header, per spec's page/item
 * list). Runs last, after every view module in app_src/modules/ has registered itself. */
(function () {
  var KEY = 'app-state-v1';

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      return s && typeof s === 'object' ? s : {};
    } catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var state = load();
  window.App = window.App || { views: {}, nav: [] };
  App.store = {
    get: function (key, fallback) { return key in state ? state[key] : fallback; },
    set: function (key, value) { state[key] = value; save(state); },
    all: function () { return state; },
  };
  /* Used by the Settings view's Import backup control. */
  App.importState = function (newState) {
    state = newState;
    save(state);
    AppRouter.init();
  };

  if (window.APP_DEMO_MODE) {
    document.getElementById('demo-banner').hidden = false;
  }

  AppRouter.init();
})();
