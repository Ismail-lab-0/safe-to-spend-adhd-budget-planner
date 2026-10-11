/* Dashboard: the one number ("safe to spend today"), a single next-step prompt, a
 * short payday forecast, a real spend-by-note donut, and quick spend logging. Every
 * figure is computed from App.store data — nothing here is sample/placeholder. */
window.App = window.App || { views: {}, nav: [] };

App.views.dashboard = {
  navLabel: 'Dashboard',
  render: function (root) {
    root.dataset.activeView = 'dashboard';
    var E = App.engine;
    var today = E.todayISO();
    var paychecks = App.store.get('paychecks', []);
    var bills = App.store.get('bills', []);
    var debts = App.store.get('debts', []);
    var goals = App.store.get('goals', []);
    var log = App.store.get('log', []);

    var monthlyIncome = paychecks.reduce(function (s, p) { return s + E.monthlyEquivalent(p); }, 0);
    var monthlyBills = bills.reduce(function (s, b) { return s + E.monthlyEquivalent(b); }, 0);
    var monthlyDebtMin = debts.reduce(function (s, d) { return s + (parseFloat(d.minPayment) || 0); }, 0);
    var monthlySavings = goals.reduce(function (s, g) { return s + (parseFloat(g.monthlyContribution) || 0); }, 0);
    var availableThisMonth = monthlyIncome - monthlyBills - monthlyDebtMin - monthlySavings;

    var now = new Date();
    var monthKey = E.monthKey(now);
    var spentThisMonth = log.filter(function (e) { return (e.date || '').slice(0, 7) === monthKey; })
      .reduce(function (s, e) { return s + (parseFloat(e.amount) || 0); }, 0);
    var daysInMonth = E.daysInMonth(now);
    var daysLeft = daysInMonth - now.getDate() + 1;
    var remainingBudget = availableThisMonth - spentThisMonth;
    var safeToday = remainingBudget / Math.max(1, daysLeft);
    var dailyAverage = availableThisMonth / daysInMonth;

    var heroClass = safeToday <= 0 ? 'danger' : (dailyAverage > 0 && safeToday < dailyAverage * 0.3 ? 'warn' : '');

    // ---- Right now: one message, one action -------------------------------------
    var rightNowHtml;
    if (paychecks.length === 0) {
      rightNowHtml =
        '<h2>Right now</h2>' +
        '<p>Add your paycheck so we can work out what’s safe to spend. Nothing else needs setting up first.</p>' +
        '<div class="row">' +
        '  <div class="field"><label for="paycheckAmount">Amount</label><input id="paycheckAmount" type="number" placeholder="2200"></div>' +
        '  <div class="field"><label for="paycheckCadence">How often</label>' +
        '    <select id="paycheckCadence">' +
        '      <option value="monthly">Once a month</option>' +
        '      <option value="biweekly">Every 2 weeks</option>' +
        '      <option value="weekly">Every week</option>' +
        '    </select>' +
        '  </div>' +
        '  <div class="field"><label for="paycheckDay">Day it lands</label><input id="paycheckDay" type="number" min="1" max="31" placeholder="e.g. 1"></div>' +
        '</div>' +
        '<button id="savePaycheckBtn" type="button">Save paycheck</button>';
    } else {
      var upcoming = bills.map(function (b) { return { bill: b, due: E.nextOccurrence(b, today) }; })
        .sort(function (a, z) { return a.due < z.due ? -1 : 1; })[0];
      var msg;
      if (safeToday <= 0) {
        msg = 'You’ve used up today’s safe-to-spend. That’s okay — it resets tomorrow.';
      } else if (upcoming && E.daysBetween(today, upcoming.due) <= 2) {
        msg = upcoming.bill.name + ' (' + E.fmtMoney(parseFloat(upcoming.bill.amount) || 0) + ') is due ' +
          (upcoming.due === today ? 'today' : E.fmtDate(upcoming.due)) + '. It’s already counted in your number above.';
      } else {
        msg = 'You’re clear to spend up to ' + E.fmtMoney(Math.max(0, safeToday)) + ' today. Log it below as you go.';
      }
      rightNowHtml = '<h2>Right now</h2><p>' + msg + '</p>';
    }

    // ---- Payday forecast ----------------------------------------------------------
    var forecastHtml = '<p class="empty">Add a paycheck to see your forecast to payday.</p>';
    if (paychecks.length) {
      var nextPayday = paychecks.map(function (p) { return E.nextOccurrence(p, today); })
        .sort()[0];
      var daysUntil = Math.max(1, E.daysBetween(today, nextPayday));
      var n = Math.min(daysUntil, 10);
      var running = remainingBudget;
      var days = [];
      for (var i = 0; i < n; i++) {
        var iso = E.addDays(today, i);
        var dueAmt = bills.filter(function (b) { return E.nextOccurrence(b, iso) === iso; })
          .reduce(function (s, b) { return s + (parseFloat(b.amount) || 0); }, 0);
        if (i > 0) running -= safeToday;
        running -= dueAmt;
        days.push('<div class="payday-day"><div>' + E.fmtDate(iso) + '</div><div class="amount ' +
          (running < 0 ? 'danger' : '') + '">' + E.fmtMoney(running) + '</div></div>');
      }
      forecastHtml = '<p class="sub" style="margin:0 0 4px">Next payday: ' + E.fmtDate(nextPayday) + '</p>' +
        '<div class="payday-list">' + days.join('') + '</div>';
    }

    // ---- Spend-by-note donut (real categories = the note text the buyer typed) ---
    var byNote = {};
    log.forEach(function (e) {
      var key = (e.note || 'Other').trim() || 'Other';
      byNote[key] = (byNote[key] || 0) + (parseFloat(e.amount) || 0);
    });
    var palette = ['#1F6F6B', '#E08E45', '#C1543C', '#8E7CC3', '#4A7A96', '#B08968'];
    var segments = Object.keys(byNote).sort(function (a, z) { return byNote[z] - byNote[a]; })
      .slice(0, 6).map(function (key, i) { return { label: key, value: byNote[key], color: palette[i % palette.length] }; });
    var chart = App.charts.donut(segments);

    // ---- Recent activity (keeps a logged spend visibly on the page, incl. after reload)
    var recent = log.slice(-6).reverse();
    var recentHtml = recent.length
      ? recent.map(function (e) {
          return '<li class="item-row"><div class="item-main"><span class="item-name">' +
            (e.note || 'Spend') + '</span><span class="item-meta">' + E.fmtDate(e.date) + '</span></div>' +
            '<span class="amount">' + E.fmtMoney(parseFloat(e.amount) || 0) + '</span></li>';
        }).join('')
      : '<li class="empty">Nothing logged yet — add your first spend below.</li>';

    root.innerHTML =
      '<h1>Dashboard</h1>' +
      '<p class="sub">One number, one next step. Everything else can wait.</p>' +
      '<div class="card">' +
      '  <div class="hero-label">Safe to spend today</div>' +
      '  <div id="safeToSpend" class="hero ' + heroClass + '">' + E.fmtMoney(safeToday) + '</div>' +
      '</div>' +
      '<div class="card right-now-card" id="rightNowCard">' + rightNowHtml + '</div>' +
      '<div class="card">' +
      '  <h2>Run to payday</h2>' +
      '  <div id="paydayForecast">' + forecastHtml + '</div>' +
      '</div>' +
      '<div class="card">' +
      '  <h2>Where it’s going</h2>' +
      '  <div id="spendChart" class="chart-wrap">' + chart.svg +
      '    <ul class="chart-legend">' + chart.legend + '</ul>' +
      '  </div>' +
      '</div>' +
      '<div class="card">' +
      '  <h2>Log a spend</h2>' +
      '  <div class="row">' +
      '    <div class="field"><label for="spendAmount">Amount</label><input id="spendAmount" type="number" placeholder="25"></div>' +
      '    <div class="field"><label for="spendNote">What was it?</label><input id="spendNote" type="text" placeholder="Groceries"></div>' +
      '  </div>' +
      '  <button id="logSpendBtn" type="button">Log spend</button>' +
      '  <ul id="recentActivity">' + recentHtml + '</ul>' +
      '</div>';

    document.getElementById('savePaycheckBtn') && document.getElementById('savePaycheckBtn').addEventListener('click', function () {
      var amount = parseFloat(document.getElementById('paycheckAmount').value);
      if (!isFinite(amount) || amount <= 0) { alert('Enter a paycheck amount first.'); return; }
      var cadence = document.getElementById('paycheckCadence').value;
      var day = parseInt(document.getElementById('paycheckDay').value, 10) || 1;
      paychecks.push({ id: E.uid(), name: 'Paycheck', amount: amount, cadence: cadence, day: day, date: today });
      App.store.set('paychecks', paychecks);
      App.views.dashboard.render(root);
    });

    document.getElementById('logSpendBtn').addEventListener('click', function () {
      var amtEl = document.getElementById('spendAmount');
      var noteEl = document.getElementById('spendNote');
      var amount = parseFloat(amtEl.value);
      if (!isFinite(amount) || amount <= 0) { alert('Enter an amount first.'); return; }
      if (window.APP_DEMO_MODE && log.length >= 10) {
        alert('The demo is limited to 10 logged spends. The full version has no limit.');
        return;
      }
      log.push({ id: E.uid(), amount: amount, note: noteEl.value.trim(), date: today });
      App.store.set('log', log);
      App.views.dashboard.render(root);
    });
  },
};
App.nav.push('dashboard');
