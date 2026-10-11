/* Savings: named goals with visible progress. An optional monthly contribution feeds
 * straight into the dashboard's safe-to-spend number, same as a bill would. */
window.App = window.App || { views: {}, nav: [] };

App.views.savings = {
  navLabel: 'Savings',
  render: function (root) {
    root.dataset.activeView = 'savings';
    var E = App.engine;
    var goals = App.store.get('goals', []);

    var rows = goals.length
      ? goals.map(function (g) {
          var target = parseFloat(g.target) || 0;
          var saved = parseFloat(g.saved) || 0;
          var pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
          return '<li class="item-row" data-goal-id="' + g.id + '" style="flex-direction:column;align-items:stretch">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">' +
            '<div class="item-main"><span class="item-name">' + g.name + '</span>' +
            '<span class="item-meta">' + E.fmtMoney(saved) + ' of ' + E.fmtMoney(target) +
            (g.monthlyContribution ? ' · ' + E.fmtMoney(parseFloat(g.monthlyContribution)) + '/mo planned' : '') +
            '</span></div>' +
            '<button type="button" class="ghost remove-goal" data-id="' + g.id + '">Remove</button></div>' +
            '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
            '<div class="row" style="margin-top:10px">' +
            '<input type="number" class="add-progress-input" data-id="' + g.id + '" placeholder="Add amount saved">' +
            '<button type="button" class="ghost add-progress-btn" data-id="' + g.id + '">Add</button></div>' +
            '</li>';
        }).join('')
      : '<li class="empty">No goals yet — add one below.</li>';

    root.innerHTML =
      '<h1>Savings</h1>' +
      '<p class="sub">See progress toward the things you’re actually saving for.</p>' +
      '<div class="card"><ul id="goalsList">' + rows + '</ul></div>' +
      '<div class="card">' +
      '  <h2>Add a goal</h2>' +
      '  <div class="row">' +
      '    <div class="field"><label for="goalName">Name</label><input id="goalName" type="text" placeholder="Emergency fund"></div>' +
      '    <div class="field"><label for="goalTarget">Target amount</label><input id="goalTarget" type="number" placeholder="1000"></div>' +
      '    <div class="field"><label for="goalMonthly">Planned monthly contribution (optional)</label><input id="goalMonthly" type="number" placeholder="50"></div>' +
      '  </div>' +
      '  <button id="addGoalBtn" type="button">Add goal</button>' +
      '</div>';

    root.querySelectorAll('.remove-goal').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id;
        App.store.set('goals', goals.filter(function (g) { return g.id !== id; }));
        App.views.savings.render(root);
      });
    });

    root.querySelectorAll('.add-progress-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id;
        var input = root.querySelector('.add-progress-input[data-id="' + id + '"]');
        var amount = parseFloat(input.value);
        if (!isFinite(amount) || amount <= 0) return;
        var g = goals.find(function (x) { return x.id === id; });
        if (!g) return;
        g.saved = (parseFloat(g.saved) || 0) + amount;
        App.store.set('goals', goals);
        App.views.savings.render(root);
      });
    });

    document.getElementById('addGoalBtn').addEventListener('click', function () {
      var name = document.getElementById('goalName').value.trim();
      var target = parseFloat(document.getElementById('goalTarget').value);
      var monthly = parseFloat(document.getElementById('goalMonthly').value);
      if (!name || !isFinite(target) || target <= 0) { alert('Enter a goal name and target amount first.'); return; }
      if (window.APP_DEMO_MODE && goals.length >= 3) {
        alert('The demo is limited to 3 goals. The full version has no limit.');
        return;
      }
      goals.push({
        id: E.uid(), name: name, target: target, saved: 0,
        monthlyContribution: isFinite(monthly) ? monthly : 0,
      });
      App.store.set('goals', goals);
      App.views.savings.render(root);
    });
  },
};
App.nav.push('savings');
