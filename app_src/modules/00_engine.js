/* Shared money/date helpers used by every view. No fake numbers anywhere downstream —
 * every figure these functions produce is derived from real App.store data. */
window.App = window.App || {};
App.engine = (function () {
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function parseISO(iso) {
    var p = iso.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  function daysInMonth(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); }
  function monthKey(date) { return date.getFullYear() + '-' + pad(date.getMonth() + 1); }
  function fmtMoney(n) {
    var sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(n).toFixed(2);
  }
  function fmtDate(iso) {
    var d = parseISO(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  /* Converts any recurring amount to its "per calendar month" equivalent, used by the
   * safe-to-spend calculation. This is what lets a buyer enter a bill the way it really
   * comes round (weekly, every 3 months, etc.) without doing the maths themselves. */
  function monthlyEquivalent(item) {
    var amt = parseFloat(item.amount) || 0;
    switch (item.cadence) {
      case 'monthly': return amt;
      case 'weekly': return amt * 52 / 12;
      case 'biweekly': return amt * 26 / 12;
      case 'every_n_months': return amt / Math.max(1, parseInt(item.months, 10) || 1);
      case 'once': return 0; // counted separately as a one-off, not folded into the monthly rate
      default: return amt;
    }
  }

  /* Next occurrence date (ISO) on/after `from` for a given cadence + anchor info. */
  function nextOccurrence(item, fromISO) {
    var from = parseISO(fromISO || todayISO());
    if (item.cadence === 'monthly' || item.cadence === 'every_n_months') {
      var day = Math.min(parseInt(item.day, 10) || 1, daysInMonth(from));
      var months = item.cadence === 'every_n_months' ? Math.max(1, parseInt(item.months, 10) || 1) : 1;
      var d = new Date(from.getFullYear(), from.getMonth(), day);
      while (d < from) d = new Date(d.getFullYear(), d.getMonth() + months, day);
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }
    if (item.cadence === 'weekly' || item.cadence === 'biweekly') {
      var anchor = item.date ? parseISO(item.date) : from;
      var step = item.cadence === 'weekly' ? 7 : 14;
      var cur = new Date(anchor);
      while (cur < from) cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + step);
      return cur.getFullYear() + '-' + pad(cur.getMonth() + 1) + '-' + pad(cur.getDate());
    }
    if (item.cadence === 'once') return item.date || fromISO;
    return fromISO;
  }

  function daysBetween(aISO, bISO) {
    var a = parseISO(aISO), b = parseISO(bISO);
    return Math.round((b - a) / 86400000);
  }

  function addDays(iso, n) {
    var d = parseISO(iso);
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  return {
    todayISO: todayISO, parseISO: parseISO, daysInMonth: daysInMonth, monthKey: monthKey,
    fmtMoney: fmtMoney, fmtDate: fmtDate, monthlyEquivalent: monthlyEquivalent,
    nextOccurrence: nextOccurrence, daysBetween: daysBetween, addDays: addDays, uid: uid,
  };
})();
