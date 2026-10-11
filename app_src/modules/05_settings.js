/* Settings: rename the planner, back up/restore your data as JSON (addresses the
 * research gap about wanting to take data out of the app), and load calm example
 * numbers to explore the app risk-free (same "calm start" idea TheLittleMachines'
 * listing describes, available here on demand rather than forced on first load so
 * the app's true empty state stays genuinely empty). */
window.App = window.App || { views: {}, nav: [] };

App.views.settings = {
  navLabel: 'Settings',
  render: function (root) {
    root.dataset.activeView = 'settings';
    var E = App.engine;
    var title = App.store.get('appTitle', '');

    root.innerHTML =
      '<h1>Settings</h1>' +
      '<p class="sub">Your data stays on this device unless you back it up yourself.</p>' +
      '<div class="card">' +
      '  <h2>Planner name</h2>' +
      '  <div class="row"><input id="appTitleInput" type="text" placeholder="My calm money plan" value="' +
      (title ? title.replace(/"/g, '&quot;') : '') + '"></div>' +
      '</div>' +
      '<div class="card">' +
      '  <h2>Backup</h2>' +
      '  <p class="item-meta">Export everything as a JSON file you keep, or restore from one.</p>' +
      '  <div class="row">' +
      '    <button id="exportBtn" type="button" class="ghost">Export backup</button>' +
      '    <button id="importBtn" type="button" class="ghost">Import backup</button>' +
      '    <input id="importFile" type="file" accept="application/json" hidden>' +
      '  </div>' +
      '</div>' +
      '<div class="card">' +
      '  <h2>Try it with example numbers</h2>' +
      '  <p class="item-meta">Loads a made-up paycheck, bills, a debt and a savings goal so you can see how the app works. Replace them with your own whenever you’re ready.</p>' +
      '  <button id="resetDemoBtn" type="button" class="ghost">Load example data</button>' +
      '</div>';

    document.getElementById('appTitleInput').addEventListener('change', function (e) {
      var v = e.target.value.trim();
      App.store.set('appTitle', v);
      var header = document.getElementById('app-title');
      if (header) header.textContent = v || 'ADHD Budget Planner';
    });

    document.getElementById('exportBtn').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(App.store.all(), null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'budget-backup.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });

    document.getElementById('importBtn').addEventListener('click', function () {
      document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var s = JSON.parse(r.result);
          if (s && typeof s === 'object') {
            App.importState(s);
          } else {
            alert('This file is not a valid backup.');
          }
        } catch (err) {
          alert('This file is not a valid backup.');
        }
      };
      r.readAsText(f);
    });

    document.getElementById('resetDemoBtn').addEventListener('click', function () {
      if (!confirm('Replace your current data with example numbers? Export a backup first if you want to keep what you have.')) return;
      var today = E.todayISO();
      App.importState({
        appTitle: 'My calm money plan',
        paychecks: [{ id: E.uid(), name: 'Paycheck', amount: 2200, cadence: 'biweekly', day: 1, date: today }],
        bills: [
          { id: E.uid(), name: 'Rent', amount: 950, cadence: 'monthly', day: 1, months: 1, date: today },
          { id: E.uid(), name: 'Phone', amount: 45, cadence: 'monthly', day: 12, months: 1, date: today },
          { id: E.uid(), name: 'Car insurance', amount: 372, cadence: 'every_n_months', day: 5, months: 6, date: today },
        ],
        debts: [{ id: E.uid(), name: 'Credit card', balance: 1200, apr: 22, minPayment: 35, payments: [] }],
        goals: [{ id: E.uid(), name: 'Emergency fund', target: 1000, saved: 150, monthlyContribution: 50 }],
        log: [
          { id: E.uid(), amount: 24.5, note: 'Groceries', date: today },
          { id: E.uid(), amount: 12, note: 'Coffee', date: today },
        ],
      });
    });
  },
};
App.nav.push('settings');
