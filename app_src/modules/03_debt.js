/* Debt: track balances, choose a payoff order (highest rate first, or smallest balance
 * first), and record real payments against a balance with a history. */
window.App = window.App || { views: {}, nav: [] };

App.views.debt = {
  navLabel: 'Debt',
  render: function (root) {
    root.dataset.activeView = 'debt';
    var E = App.engine;
    var debts = App.store.get('debts', []);
    var order = App.store.get('debtOrder', 'highest_rate');

    var sorted = debts.slice().sort(function (a, z) {
      return order === 'highest_rate'
        ? (parseFloat(z.apr) || 0) - (parseFloat(a.apr) || 0)
        : (parseFloat(a.balance) || 0) - (parseFloat(z.balance) || 0);
    });

    var rows = sorted.length
      ? sorted.map(function (d, i) {
          var paid = (d.payments || []).reduce(function (s, p) { return s + p.amount; }, 0);
          return '<li class="item-row" data-debt-id="' + d.id + '"><div class="item-main">' +
            '<span class="item-name">' + (i === 0 ? '★ ' : '') + d.name + '</span>' +
            '<span class="item-meta">' + (d.apr ? d.apr + '% APR · ' : '') +
            'min ' + E.fmtMoney(parseFloat(d.minPayment) || 0) + '/mo · ' +
            E.fmtMoney(paid) + ' paid toward it so far</span></div>' +
            '<span class="amount">' + E.fmtMoney(parseFloat(d.balance) || 0) + '</span>' +
            '<button type="button" class="ghost remove-debt" data-id="' + d.id + '">Remove</button></li>';
        }).join('')
      : '<li class="empty">No debts yet — add one below, or skip this if it doesn’t apply to you.</li>';

    var options = sorted.map(function (d) { return '<option value="' + d.id + '">' + d.name + '</option>'; }).join('');

    root.innerHTML =
      '<h1>Debt</h1>' +
      '<p class="sub">★ marks the one to focus extra payments on first.</p>' +
      '<div class="card">' +
      '  <label for="debtOrderToggle">Payoff order</label>' +
      '  <select id="debtOrderToggle">' +
      '    <option value="highest_rate"' + (order === 'highest_rate' ? ' selected' : '') + '>Highest interest rate first</option>' +
      '    <option value="smallest_balance"' + (order === 'smallest_balance' ? ' selected' : '') + '>Smallest balance first</option>' +
      '  </select>' +
      '  <ul id="debtList">' + rows + '</ul>' +
      '</div>' +
      (sorted.length ? '<div class="card">' +
      '  <h2>Record a payment</h2>' +
      '  <div class="row">' +
      '    <div class="field"><label for="debtPaymentTarget">Which debt</label><select id="debtPaymentTarget">' + options + '</select></div>' +
      '    <div class="field"><label for="debtPaymentAmount">Amount</label><input id="debtPaymentAmount" type="number" placeholder="50"></div>' +
      '  </div>' +
      '  <button id="recordDebtPaymentBtn" type="button">Record payment</button>' +
      '</div>' : '') +
      '<div class="card">' +
      '  <h2>Add a debt</h2>' +
      '  <div class="row">' +
      '    <div class="field"><label for="debtName">Name</label><input id="debtName" type="text" placeholder="Credit card"></div>' +
      '    <div class="field"><label for="debtBalance">Balance</label><input id="debtBalance" type="number" placeholder="1200"></div>' +
      '    <div class="field"><label for="debtApr">APR % (optional)</label><input id="debtApr" type="number" placeholder="22"></div>' +
      '    <div class="field"><label for="debtMinPayment">Minimum payment / month</label><input id="debtMinPayment" type="number" placeholder="35"></div>' +
      '  </div>' +
      '  <button id="addDebtBtn" type="button">Add debt</button>' +
      '</div>';

    document.getElementById('debtOrderToggle').addEventListener('change', function (e) {
      App.store.set('debtOrder', e.target.value);
      App.views.debt.render(root);
    });

    root.querySelectorAll('.remove-debt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id;
        App.store.set('debts', debts.filter(function (d) { return d.id !== id; }));
        App.views.debt.render(root);
      });
    });

    var recordBtn = document.getElementById('recordDebtPaymentBtn');
    if (recordBtn) {
      recordBtn.addEventListener('click', function () {
        var targetId = document.getElementById('debtPaymentTarget').value;
        var amount = parseFloat(document.getElementById('debtPaymentAmount').value);
        if (!isFinite(amount) || amount <= 0) { alert('Enter a payment amount first.'); return; }
        var d = debts.find(function (x) { return x.id === targetId; });
        if (!d) return;
        d.payments = d.payments || [];
        d.payments.push({ date: E.todayISO(), amount: amount });
        d.balance = Math.max(0, (parseFloat(d.balance) || 0) - amount);
        App.store.set('debts', debts);
        App.views.debt.render(root);
      });
    }

    document.getElementById('addDebtBtn').addEventListener('click', function () {
      var name = document.getElementById('debtName').value.trim();
      var balance = parseFloat(document.getElementById('debtBalance').value);
      var apr = parseFloat(document.getElementById('debtApr').value);
      var minPayment = parseFloat(document.getElementById('debtMinPayment').value);
      if (!name || !isFinite(balance) || balance < 0) { alert('Enter a debt name and balance first.'); return; }
      if (window.APP_DEMO_MODE && debts.length >= 3) {
        alert('The demo is limited to 3 debts. The full version has no limit.');
        return;
      }
      debts.push({
        id: E.uid(), name: name, balance: balance,
        apr: isFinite(apr) ? apr : null,
        minPayment: isFinite(minPayment) ? minPayment : 0,
        payments: [],
      });
      App.store.set('debts', debts);
      App.views.debt.render(root);
    });
  },
};
App.nav.push('debt');
