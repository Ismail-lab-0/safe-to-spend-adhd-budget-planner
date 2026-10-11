/* Tiny inline-SVG chart helpers — no CDN chart library (would break the self-contained/
 * no-network invariant). Reads real app state only, never sample/placeholder numbers. */
window.App = window.App || {};
App.charts = {
  /* segments: [{label, value, color}]. Returns an SVG ring + a separate legend list
   * (caller composes them side by side in .chart-wrap / .chart-legend). */
  donut: function (segments) {
    var total = segments.reduce(function (s, seg) { return s + seg.value; }, 0);
    var r = 54, cx = 64, cy = 64, circumference = 2 * Math.PI * r;
    if (total <= 0) {
      return {
        svg: '<svg viewBox="0 0 128 128" role="img" aria-label="No spending logged yet">' +
          '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--border)" stroke-width="16"></circle>' +
          '</svg>',
        legend: '<li class="empty">Nothing logged yet</li>',
      };
    }
    var offset = 0;
    var arcs = segments.map(function (seg) {
      var frac = seg.value / total;
      var dash = frac * circumference;
      var circle = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + seg.color +
        '" stroke-width="16" stroke-dasharray="' + dash + ' ' + (circumference - dash) +
        '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"></circle>';
      offset += dash;
      return circle;
    }).join('');
    var legend = segments.map(function (seg) {
      return '<li><span class="chart-dot" style="background:' + seg.color + '"></span>' +
        seg.label + ' — $' + seg.value.toFixed(2) + '</li>';
    }).join('');
    return {
      svg: '<svg viewBox="0 0 128 128" role="img" aria-label="Spending by category">' + arcs + '</svg>',
      legend: legend,
    };
  },
};
