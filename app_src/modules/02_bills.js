/* Bills: flexible recurring cadence (monthly / every 2 weeks / every week / every few
 * months / just once) so a buyer never has to re-enter a bill that "comes round however
 * it really comes round" (research gap). Each bill's monthly-equivalent cost feeds the
 * dashboard's safe-to-spend number automatically — nothing here needs re-budgeting by hand. */
window.App = window.App || { views: {}, nav: [] };

App.views.bills = {
  navLabel: 'Bills',
  render: function (root) {
    root.dataset.activeView = 'bills';
    var E = App.engine;
    var bills = App.store.get('bills', []);

    var rows = bills.length
      ? bills.map(function (b) {
          var next = E.nextOccurrence(b, E.todayISO());
          return '<li class="item-row" data-bill-id="' + b.id + '"><div class="item-main">' +
            '<span class="item-name">' + b.name + '</span>' +
            '<span class="item-meta">' + cadenceLabel(b) + ' · next ' + E.fmtDate(next) +
            ' · ' + E.fmtMoney(E.monthlyEquivalent(b)) + '/mo equivalent</span></div>' +
            '<span class="amount">' + E.fmtMoney(parseFloat(b.amount) || 0) + '</span>' +
            '<button type="button" class="ghost remove-bill" data-id="' + b.id + '">Remove</button></li>';
        }).join('')
      : '<li class="empty">No bills yet — add your first one below.</li>';

    root.innerHTML =
      '<h1>Bills</h1>' +
      '<p class="sub">Add a bill once — it carries forward on its own schedule.</p>' +
      '<div class="card"><ul id="billsList">' + rows + '</ul></div>' +
      '<div class="card">' +
      '  <h2>Add a bill</h2>' +
      '  <div class="row">' +
      '    <div class="field"><label for="billName">Name</label><input id="billName" type="text" placeholder="Rent"></div>' +
      '    <div class="field"><label for="billAmount">Amount</label><input id="billAmount" type="number" placeholder="950"></div>' +
      '  </div>' +
      '  <div class="row">' +
      '    <div class="field"><label for="billCadence">How often</label>' +
      '      <select id="billCadence">' +
      '        <option value="monthly">Once a month</option>' +
      '        <option value="biweekly">Every 2 weeks</option>' +
      '        <option value="weekly">Every week</option>' +
      '        <option value="every_n_months">Every few months</option>' +
      '        <option value="once">Just once</option>' +
      '      </select>' +
      '    </div>' +
      '    <div class="field"><label for="billDay">Day of month (if monthly)</label><input id="billDay" type="number" min="1" max="31" placeholder="1"></div>' +
      '    <div class="field"><label for="billMonths">Every how many months (if “every few months”)</label><input id="billMonths" type="number" min="2" max="12" placeholder="3"></div>' +
      '    <div class="field"><label for="billDate">Date (if weekly / every 2 weeks / just once)</label><input id="billDate" type="date"></div>' +
      '  </div>' +
      '  <button id="addBillBtn" type="button">Add bill</button>' +
      '</div>';

    function cadenceLabel(b) {
      switch (b.cadence) {
        case 'monthly': return 'Once a month';
        case 'biweekly': return 'Every 2 weeks';
        case 'weekly': return 'Every week';
        case 'every_n_months': return 'Every ' + (b.months || 1) + ' months';
        case 'once': return 'One-off';
        default: return b.cadence;
      }
    }

    root.querySelectorAll('.remove-bill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id;
        App.store.set('bills', bills.filter(function (b) { return b.id !== id; }));
        App.views.bills.render(root);
      });
    });

    document.getElementById('addBillBtn').addEventListener('click', function () {
      var name = document.getElementById('billName').value.trim();
      var amount = parseFloat(document.getElementById('billAmount').value);
      if (!name || !isFinite(amount) || amount <= 0) { alert('Enter a bill name and amount first.'); return; }
      if (window.APP_DEMO_MODE && bills.length >= 5) {
        alert('The demo is limited to 5 bills. The full version has no limit.');
        return;
      }
      var cadence = document.getElementById('billCadence').value;
      var day = parseInt(document.getElementById('billDay').value, 10) || 1;
      var months = parseInt(document.getElementById('billMonths').value, 10) || 3;
      var date = document.getElementById('billDate').value || E.todayISO();
      bills.push({ id: E.uid(), name: name, amount: amount, cadence: cadence, day: day, months: months, date: date });
      App.store.set('bills', bills);
      App.views.bills.render(root);
    });
  },
};
App.nav.push('bills');
