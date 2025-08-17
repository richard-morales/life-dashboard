/**
 * Progress Tracker widget
 * ------------------------------------------------------------
 * Renders one progress card per tracker (chart + stats + history table).
 * - Data model is persisted to localStorage under "progressTrackers".
 * - Charts are drawn with Chart.js (line), with a custom horizontal scrollbar.
 * - Table body shows a scrollable window of the most recent rows.
 *
 * Key UX decisions:
 * - The chart area scrolls horizontally (no squeezing with many points).
 * - Custom bar (left/right arrows + draggable thumb) controls horizontal scroll.
 * - The chart height is synced to the stats/table area for visual balance.
 * - A placeholder option is injected into the unit <select> for clearer UX.
 *
 * Dependencies:
 * - Chart.js (and chartjs-plugin-zoom if present)
 *
 * Notes for maintainers:
 * - Keep comments focused on *why* and non-obvious *what*.
 * - If you modify the data shape, update the JSDoc typedefs below.
 */

/**
 * @typedef {Object} Tracker
 * @property {number} id               Unique per tracker (Date.now()).
 * @property {string} description      User-entered label.
 * @property {string} unit             Measurement unit (e.g., "kg", "reps", custom).
 * @property {{date:string,value:number}[]} history  ISO date + numeric value (ascending by date when rendered).
 */

// ====== Config ======
// Tweakable constants collected here to avoid magic numbers in logic.
const MIN_CHART_HEIGHT = 220;
const MAX_CHART_HEIGHT = 480;
const MAX_VISIBLE_TICKS = 8;
const VISIBLE_ROWS = 5; // Table shows a 5-row window with sticky header.
const SCROLL_STEP = 200; // Custom scrollbar: px moved per arrow tap.
const SCROLL_HOLD_MS = 18; // Custom scrollbar: repeat rate while holding arrows.

/**
 * Compute horizontal pixels-per-point for the chart given the sample size.
 * Wider spacing for low counts, tighter for dense series.
 * @param {number} count
 * @returns {number}
 */
function pxPerPoint(count) {
  if (count <= 30) return 60;
  if (count <= 80) return 40;
  if (count <= 200) return 28;
  return 18;
}

// ====== Date helpers (local-safe) ======

/**
 * Get today's date as YYYY-MM-DD in local time (avoids UTC day-shift issues).
 * @returns {string}
 */
function todayLocalISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse YYYY-MM-DD to a local Date object.
 * @param {string} s
 * @returns {Date}
 */
function parseISODateLocal(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ====== DOM ======
const form = document.getElementById("progress-form");
const descriptionInput = document.getElementById("item-description");
const unitSelect = document.getElementById("unit-measure-progress");
const customUnitInput = document.getElementById("custom-unit-progress");
const progressTrackersContainer = document.getElementById(
  "progress-trackers-container"
);

/**
 * Ensure the <select> element has a non-submittable placeholder option.
 * When `forceSelect` is true, the placeholder is always selected, overriding
 * browser memory of previous choices (useful on page load or form reset).
 *
 * @param {boolean} [forceSelect=false] - Forces the placeholder to be selected.
 */
function ensureSelectPlaceholder(forceSelect = false) {
  if (!unitSelect) return;

  // Make the field required for form validation
  unitSelect.required = true;

  // Look for an existing placeholder option
  let placeholder = unitSelect.querySelector('option[data-placeholder="true"]');

  // If it doesn't exist, create and insert it as the first option
  if (!placeholder) {
    placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.textContent = "Select unit";
    placeholder.setAttribute("data-placeholder", "true");
    unitSelect.insertBefore(placeholder, unitSelect.firstChild);
  }

  // If forceSelect is true, reset the selection to the placeholder
  if (forceSelect) {
    unitSelect.selectedIndex = 0;
  }
}

// Ensure placeholder is selected when the page loads
document.addEventListener("DOMContentLoaded", () => {
  ensureSelectPlaceholder(true);
});

/**
 * Show/hide the custom unit input based on the current select value.
 * Keeps behavior correct on reloads, changes, and form resets.
 */
function updateCustomUnitVisibility() {
  customUnitInput.style.display = unitSelect.value === "custom" ? "" : "none";
}

// ====== State ======
// All trackers in-memory; persisted to localStorage on each change.
let trackers = [];
// Chart.js instances by tracker id (so we can destroy/recreate safely).
const chartInstances = {};
// DOM caches for custom scrolling mechanics.
const chartInnerMap = {}; // trackerId -> inner div that controls width
const hbarTrackMap = {}; // trackerId -> custom bar track
const hbarThumbMap = {}; // trackerId -> custom bar thumb
const arrowTimers = {}; // trackerId -> {left,right}

// ====== Restore on load ======
window.addEventListener("DOMContentLoaded", () => {
  try {
    const saved = localStorage.getItem("progressTrackers");
    if (saved) {
      trackers = JSON.parse(saved);
      trackers.forEach(renderTracker);
    }
  } catch {
    // If corrupted storage or parsing fails, start clean.
    trackers = [];
  }

  // UX: Insert placeholder on first visit, or re-assert after resets.
  ensureSelectPlaceholder(trackers.length === 0);
  // Ensure custom unit input matches current selection on reload.
  updateCustomUnitVisibility();

  // Keep the custom bar thumb sized/positioned on viewport changes.
  window.addEventListener("resize", () =>
    trackers.forEach((t) => updateScrollbarMetrics(t.id))
  );
});

// ====== Persistence ======

/**
 * Persist the current trackers array to localStorage.
 * Single source of truth for storage writes.
 */
function saveTrackers() {
  localStorage.setItem("progressTrackers", JSON.stringify(trackers));
}

// ====== Unit toggle ======
unitSelect.addEventListener("change", updateCustomUnitVisibility);

// ====== Create tracker ======
form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Guard: placeholder is disabled and has empty value.
  let unit = unitSelect.value;
  if (!unit) return alert("Please select a unit.");

  if (unit === "custom") {
    unit = customUnitInput.value.trim();
    if (!unit) return alert("Enter a custom unit.");
  }
  const desc = descriptionInput.value.trim();
  if (!desc) return;

  /** @type {Tracker} */
  const tracker = { id: Date.now(), description: desc, unit, history: [] };
  trackers.push(tracker);
  saveTrackers();
  renderTracker(tracker);

  // Reset form and restore placeholder + custom unit visibility.
  form.reset();
  ensureSelectPlaceholder(true);
  updateCustomUnitVisibility();
});

// ====== Delete tracker ======

/**
 * Remove a tracker, its chart instance, and its DOM section.
 * @param {number} id
 * @param {HTMLElement} [sectionNode]
 */
function deleteTracker(id, sectionNode) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
  delete chartInnerMap[id];
  delete hbarTrackMap[id];
  delete hbarThumbMap[id];
  arrowTimers[id] = null;

  trackers = trackers.filter((t) => t.id !== id);
  saveTrackers();

  if (sectionNode?.parentNode) sectionNode.parentNode.removeChild(sectionNode);
  if (trackers.length === 0) progressTrackersContainer.innerHTML = "";
}

// ====== Render tracker ======

/**
 * Create all DOM for a tracker card and mount it.
 * Includes: header, input + add button, chart area, custom scrollbar, and stats/table.
 * @param {Tracker} tracker
 */
function renderTracker(tracker) {
  const card = document.createElement("div");
  card.className = "progress-card card";

  // Header (title + delete)
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";

  const title = document.createElement("h3");
  title.textContent = `${tracker.description} (${tracker.unit})`;
  title.style.margin = "0";

  const delBtn = document.createElement("button");
  delBtn.className = "delete-progress";
  delBtn.type = "button";
  delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
  delBtn.title = "Delete tracker";
  delBtn.setAttribute("aria-label", "Delete tracker");

  const trackerSection = document.createElement("section");
  trackerSection.className = "tracker-section";

  delBtn.addEventListener("click", () => {
    if (confirm("Delete this tracker and its history?"))
      deleteTracker(tracker.id, trackerSection);
  });

  header.append(title, delBtn);

  // Input + button for new measurement
  const input = document.createElement("input");
  input.type = "number";
  input.step = "any";
  input.placeholder = `Enter result in ${tracker.unit}`;

  const btn = document.createElement("button");
  btn.className = "submit-progress";
  btn.type = "button";
  btn.textContent = "Add Result";

  /**
   * Push a new data point (today's date + numeric value).
   * Validates positive numbers only; redraws chart and table.
   */
  function addEntry() {
    const val = parseFloat((input.value || "").trim());
    if (isNaN(val) || val <= 0)
      return alert("Please enter a number greater than 0.");
    const date = todayLocalISO();
    tracker.history.push({ date, value: val });
    saveTrackers();
    drawChart(tracker);
    renderStatsAndTable(tracker);
    input.value = "";
  }
  btn.addEventListener("click", addEntry);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEntry();
    }
  });

  // ===== Layout container for chart + custom bar + table =====
  const area = document.createElement("div");
  area.className = "chart-and-table-vertical"; // CSS controls column layout + gaps.

  // Chart scroll container (native scrollbar hidden via CSS)
  const wrap = document.createElement("div");
  wrap.className = "chart-scroll-container";
  wrap.id = `wrap-${tracker.id}`;
  // Inline styles kept in JS because height is synced dynamically.
  wrap.style.height = `${MIN_CHART_HEIGHT}px`;
  wrap.style.minWidth = "0";
  wrap.style.overflowX = "auto";
  enableHorizontalScrollUX(wrap);

  // Inner width controller (stretched to data width so we can scroll)
  const inner = document.createElement("div");
  inner.id = `inner-${tracker.id}`;
  inner.style.height = "100%";
  inner.style.display = "inline-block";
  inner.style.minWidth = "100%";
  chartInnerMap[tracker.id] = inner;

  // Chart canvas (sized via exact pixels for crisp DPR rendering)
  const canvas = document.createElement("canvas");
  canvas.id = `chart-${tracker.id}`;
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  inner.appendChild(canvas);
  wrap.appendChild(inner);

  // Custom horizontal scrollbar row (◀ track ▶)
  const barRow = document.createElement("div");
  barRow.className = "hbar-row";

  const leftBtn = document.createElement("button");
  leftBtn.type = "button";
  leftBtn.innerHTML = "◀";
  leftBtn.title = "Scroll left";
  leftBtn.setAttribute("aria-label", "Scroll chart left");
  styleArrowBtn(leftBtn);

  const rightBtn = document.createElement("button");
  rightBtn.type = "button";
  rightBtn.innerHTML = "▶";
  rightBtn.title = "Scroll right";
  rightBtn.setAttribute("aria-label", "Scroll chart right");
  styleArrowBtn(rightBtn);

  const track = document.createElement("div");
  track.className = "hbar-track";
  const thumb = document.createElement("div");
  thumb.className = "hbar-thumb";
  track.appendChild(thumb);

  barRow.append(leftBtn, track, rightBtn);
  hbarTrackMap[tracker.id] = track;
  hbarThumbMap[tracker.id] = thumb;
  arrowTimers[tracker.id] = { left: null, right: null };

  // Arrow behavior (click & hold for continuous scroll)
  setupArrow(
    leftBtn,
    () => smoothScrollBy(wrap, -SCROLL_STEP),
    tracker.id,
    "left"
  );
  setupArrow(
    rightBtn,
    () => smoothScrollBy(wrap, +SCROLL_STEP),
    tracker.id,
    "right"
  );

  // Clicking the track jumps the thumb (and chart) to that position.
  track.addEventListener("mousedown", (e) => {
    if (e.target === thumb) return; // dragging handled separately below
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const state = getScrollState(tracker.id);
    const newLeft = clamp(x - state.thumbW / 2, 0, state.trackW - state.thumbW);
    setScrollFromThumbLeft(tracker.id, newLeft);
  });

  // Enable thumb dragging for fine-grained control.
  setupThumbDrag(tracker.id);

  // Stats + table container (table body is scrollable window)
  const info = document.createElement("div");
  info.className = "history-table-container";
  info.id = `table-${tracker.id}`;

  area.append(wrap);
  area.append(barRow);
  area.append(info);

  card.append(header, input, btn, area);
  trackerSection.appendChild(card);
  progressTrackersContainer.appendChild(trackerSection);

  // Initial render after mounting.
  drawChart(tracker);
  renderStatsAndTable(tracker);

  // Keep custom thumb position in sync when user drags chart directly.
  wrap.addEventListener("scroll", () => updateThumbPosition(tracker.id));
}

// ====== Chart drawing ======

/**
 * Create/replace the Chart.js line chart for the given tracker.
 * Handles pixel-perfect canvas sizing (DPR) and dynamic inner width.
 * @param {Tracker} tracker
 */
function drawChart(tracker) {
  const canvas = document.getElementById(`chart-${tracker.id}`);
  const wrap = document.getElementById(`wrap-${tracker.id}`);
  const inner = chartInnerMap[tracker.id];
  if (!canvas || !wrap || !inner) return;

  const ctx = canvas.getContext("2d");
  if (chartInstances[tracker.id]) {
    chartInstances[tracker.id].destroy();
  }

  // Keep history sorted by date for correct time order in the chart.
  const history = tracker.history
    .slice()
    .sort((a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));
  const labels = history.map((e) => e.date);
  const data = history.map((e) => e.value);

  // Set inner width so the chart can scroll horizontally as points grow.
  const widthNeeded = Math.max(
    wrap.clientWidth,
    labels.length * pxPerPoint(labels.length)
  );
  inner.style.width = widthNeeded + "px";

  // DPR-aware canvas sizing for crisp lines.
  const dpr = window.devicePixelRatio || 1;
  const cssW = inner.clientWidth;
  const cssH = wrap.clientHeight;
  canvas.width = Math.max(1, Math.floor(cssW * dpr));
  canvas.height = Math.max(1, Math.floor(cssH * dpr));
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";

  const manyPoints = labels.length > 60;

  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: tracker.unit,
          data,
          borderColor: "#64b5f6",
          backgroundColor: "rgba(100,181,246,0.2)",
          fill: true,
          tension: 0.3,
          pointRadius: manyPoints ? 1 : 3,
          pointHoverRadius: manyPoints ? 3 : 5,
        },
      ],
    },
    options: {
      responsive: false, // We manage size explicitly for horizontal scroll.
      maintainAspectRatio: false,
      plugins: {
        decimation: { enabled: true, algorithm: "lttb", samples: 200 },
        zoom: {
          pan: { enabled: false },
          zoom: {
            wheel: { enabled: true, speed: 0.08 },
            pinch: { enabled: true },
            mode: "x",
          },
        },
        legend: { display: false },
      },
      scales: {
        x: { ticks: { autoSkip: true, maxTicksLimit: MAX_VISIBLE_TICKS } },
        y: { beginAtZero: true, grace: "15%" },
      },
    },
  });

  chartInstances[tracker.id] = chart;

  // UX: Jump to the latest point and size custom scrollbar correctly.
  requestAnimationFrame(() => {
    wrap.scrollLeft = wrap.scrollWidth;
    updateScrollbarMetrics(tracker.id);
    updateThumbPosition(tracker.id);
  });
}

// ====== Stats + Scrollable Table (5-row body, sticky header) ======

/**
 * Render summary stats and a scrollable table (latest rows at the top).
 * Table body is capped to VISIBLE_ROWS via a max-height holder.
 * @param {Tracker} tracker
 */
function renderStatsAndTable(tracker) {
  const container = document.getElementById(`table-${tracker.id}`);
  const wrap = document.getElementById(`wrap-${tracker.id}`);
  if (!container || !wrap) return;

  const history = tracker.history
    .slice()
    .sort((a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date));

  if (history.length === 0) {
    container.innerHTML = "<p>No data yet.</p>";
    syncChartHeightToTable(tracker.id);
    return;
  }

  const values = history.map((e) => e.value);
  const sum = values.reduce((a, v) => a + v, 0);
  const avg = (sum / values.length).toFixed(2);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const latest = values[values.length - 1];
  const growth = (latest - values[0]).toFixed(2);

  const rowsHtml = history
    .slice()
    .reverse()
    .map((e) => `<tr><td>${e.date}</td><td>${e.value}</td></tr>`)
    .join("");

  container.innerHTML = `
    <div class="stats-box stats-horizontal">
      <span><strong>Avg:</strong> ${avg} ${tracker.unit}</span>
      <span><strong>Min:</strong> ${min}</span>
      <span><strong>Max:</strong> ${max}</span>
      <span><strong>Latest:</strong> ${latest}</span>
      <span><strong>Growth:</strong> ${growth}</span>
    </div>
    <div class="history-table-scroll" id="scroll-${tracker.id}">
      <table class="history-table" id="table-el-${tracker.id}">
        <thead>
          <tr>
            <th>Date</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;

  // Table is a normal table; we wrap it in a scroll container with sticky thead.
  const tableEl = document.getElementById(`table-el-${tracker.id}`);
  tableEl.style.display = "table";
  tableEl.style.maxHeight = "none";
  tableEl.style.overflow = "visible";

  // Sticky header while the tbody scrolls.
  container.querySelectorAll("thead th").forEach((th) => {
    th.style.position = "sticky";
    th.style.top = "0";
    th.style.zIndex = "1";
    th.style.background = th.style.background || "#f6fafd";
  });

  // Compute max-height to show exactly VISIBLE_ROWS + header, then enable scroll.
  const scrollWrap = document.getElementById(`scroll-${tracker.id}`);
  const thead = scrollWrap.querySelector("thead");
  const tbody = scrollWrap.querySelector("tbody");
  const firstRow = tbody.querySelector("tr");

  requestAnimationFrame(() => {
    const headerH = thead.getBoundingClientRect().height || 32;
    const rowH = (firstRow && firstRow.getBoundingClientRect().height) || 32;
    const rowsCount = tbody.querySelectorAll("tr").length;
    const desired = headerH + rowH * VISIBLE_ROWS;
    scrollWrap.style.maxHeight = `${desired}px`;
    scrollWrap.style.overflowY = rowsCount > VISIBLE_ROWS ? "auto" : "hidden";
    scrollWrap.scrollTop = 0;

    // Resize chart container to roughly match the info area (visual balance).
    syncChartHeightToTable(tracker.id);
  });
}

// ====== Custom scrollbar logic ======

/**
 * Gather current geometry for wrap/track/thumb and compute useful derived values.
 * @param {number} id
 */
function getScrollState(id) {
  const wrap = document.getElementById(`wrap-${id}`);
  const inner = chartInnerMap[id];
  const track = hbarTrackMap[id];
  const thumb = hbarThumbMap[id];
  const trackW = track.clientWidth;
  const total = Math.max(1, inner.scrollWidth || inner.clientWidth);
  const visible = Math.max(1, wrap.clientWidth);
  const maxScroll = Math.max(0, total - visible);
  const ratio = Math.min(1, visible / total);
  const minThumb = 28; // Prevents a tiny, hard-to-grab thumb.
  const thumbW = Math.max(minThumb, Math.floor(trackW * ratio));
  return {
    wrap,
    inner,
    track,
    thumb,
    trackW,
    total,
    visible,
    maxScroll,
    ratio,
    thumbW,
  };
}

/**
 * Size the custom thumb and ensure it stays within the track bounds.
 * Hide the custom track entirely if no horizontal overflow exists.
 * @param {number} id
 */
function updateScrollbarMetrics(id) {
  const { thumb, thumbW, trackW, maxScroll } = getScrollState(id);
  thumb.style.width = `${thumbW}px`;
  hbarTrackMap[id].style.visibility = maxScroll <= 0 ? "hidden" : "visible";
  const left = parseFloat(thumb.style.left || "0");
  thumb.style.left = `${clamp(left, 0, Math.max(0, trackW - thumbW))}px`;
}

/**
 * Move the custom thumb to reflect the wrap's current scrollLeft.
 * @param {number} id
 */
function updateThumbPosition(id) {
  const { wrap, trackW, thumbW, maxScroll } = getScrollState(id);
  if (maxScroll <= 0) {
    hbarTrackMap[id].style.visibility = "hidden";
    return;
  }
  const pos = (wrap.scrollLeft / maxScroll) * (trackW - thumbW);
  hbarThumbMap[id].style.left = `${clamp(pos, 0, trackW - thumbW)}px`;
}

/**
 * Given a desired thumb-left (px), set wrap.scrollLeft proportionally.
 * @param {number} id
 * @param {number} leftPx
 */
function setScrollFromThumbLeft(id, leftPx) {
  const { wrap, trackW, thumbW, maxScroll } = getScrollState(id);
  if (maxScroll <= 0) return;
  const ratio = leftPx / Math.max(1, trackW - thumbW);
  wrap.scrollLeft = ratio * maxScroll;
  updateThumbPosition(id);
}

/**
 * Enable mouse/touch dragging on the custom thumb.
 * Adds a "grabbing" / "dragging" class during the drag for better cursor UX.
 * @param {number} id
 */
function setupThumbDrag(id) {
  const thumb = hbarThumbMap[id];
  const track = hbarTrackMap[id];

  const onMove = (startX, startLeft) => (ev) => {
    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const dx = clientX - startX;
    const { trackW, thumbW } = getScrollState(id);
    const newLeft = clamp(startLeft + dx, 0, trackW - thumbW);
    setScrollFromThumbLeft(id, newLeft);
    ev.preventDefault();
  };

  const attach = (startX, startLeft) => {
    const move = onMove(startX, startLeft);
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
      document.body.style.userSelect = "";
      // Remove grabbing state (cursor + track/ thumb feedback).
      thumb.classList.remove("grabbing");
      track.classList.remove("dragging");
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", up);
    document.body.style.userSelect = "none";
  };

  thumb.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startLeft = parseFloat(thumb.style.left || "0") || 0;
    thumb.classList.add("grabbing");
    track.classList.add("dragging");
    attach(e.clientX, startLeft);
  });

  thumb.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startLeft = parseFloat(thumb.style.left || "0") || 0;
      thumb.classList.add("grabbing");
      track.classList.add("dragging");
      attach(e.touches[0].clientX, startLeft);
    },
    { passive: false }
  );
}

// ====== Scroll helpers ======

/**
 * Wire up an arrow button to scroll the wrap by a fixed step.
 * Supports click-and-hold with a repeat interval.
 * @param {HTMLButtonElement} btn
 * @param {() => void} action
 * @param {number} id
 * @param {"left"|"right"} side
 */
function setupArrow(btn, action, id, side) {
  const timers = arrowTimers[id];
  const start = () => {
    if (timers[side]) return;
    action();
    timers[side] = setInterval(action, SCROLL_HOLD_MS);
  };
  const stop = () => {
    clearInterval(timers[side]);
    timers[side] = null;
  };
  btn.addEventListener("mousedown", start);
  btn.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      start();
    },
    { passive: false }
  );
  ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((evt) =>
    btn.addEventListener(evt, stop)
  );
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    action();
  });
}

/**
 * Smooth horizontal scroll helper for the chart wrap.
 * @param {HTMLElement} el
 * @param {number} dx
 */
function smoothScrollBy(el, dx) {
  el.scrollBy({ left: dx, behavior: "smooth" });
}

// ====== Misc helpers ======

/**
 * Clamp a number between [min, max].
 * @param {number} n
 * @param {number} min
 * @param {number} max
 */
function clamp(n, min, max) {
  return Math.max(min, Math.min(n, max));
}

/**
 * Visually sync chart container height to the info area to avoid large imbalance.
 * Chart.js requires resize() after height changes for crisp rendering.
 * @param {number} trackerId
 */
function syncChartHeightToTable(trackerId) {
  const wrap = document.getElementById(`wrap-${trackerId}`);
  const tableBox = document.getElementById(`table-${trackerId}`);
  const chart = chartInstances[trackerId];
  if (!wrap || !tableBox || !chart) return;

  requestAnimationFrame(() => {
    const h = tableBox.getBoundingClientRect().height;
    const target = clamp(h, MIN_CHART_HEIGHT, MAX_CHART_HEIGHT);
    wrap.style.height = `${target}px`;
    chart.resize();
    // Second resize after paint helps with DPR/layout edge cases.
    requestAnimationFrame(() => chart.resize());
  });
}

/**
 * Enable pointer/trackpad dragging to scroll horizontally.
 * Wheel on vertical delta is remapped to horizontal movement for convenience.
 * @param {HTMLElement} wrap
 */
function enableHorizontalScrollUX(wrap) {
  wrap.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.altKey) return; // allow browser zoom/alt behaviors
      if (wrap.scrollWidth <= wrap.clientWidth) return;
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        wrap.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Drag-to-scroll (pointer events)
  let isDown = false,
    startX = 0,
    startLeft = 0;

  wrap.addEventListener("pointerdown", (e) => {
    isDown = true;
    startX = e.clientX;
    startLeft = wrap.scrollLeft;
    wrap.setPointerCapture(e.pointerId);
    wrap.classList.add("grabbing"); // CSS toggles cursor feedback
  });

  wrap.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    wrap.scrollLeft = startLeft - (e.clientX - startX);
    updateThumbPositionFromRAF(wrap.id);
  });

  const endDrag = (e) => {
    if (!isDown) return;
    isDown = false;
    try {
      wrap.releasePointerCapture(e.pointerId);
    } catch {}
    wrap.classList.remove("grabbing");
  };
  wrap.addEventListener("pointerup", endDrag);
  wrap.addEventListener("pointercancel", endDrag);
  wrap.addEventListener("pointerleave", endDrag);
}

/**
 * Coalesce frequent drag updates behind rAF to keep the custom thumb smooth.
 * @param {string} wrapId
 */
function updateThumbPositionFromRAF(wrapId) {
  const id = parseInt(wrapId.split("wrap-")[1], 10);
  requestAnimationFrame(() => updateThumbPosition(id));
}

/**
 * Apply minimal styles to arrow buttons via a shared CSS class.
 * @param {HTMLButtonElement} btn
 */
function styleArrowBtn(btn) {
  btn.classList.add("arrow-btn");
  btn.addEventListener("mouseenter", () => (btn.style.background = "#eaf2ff"));
  btn.addEventListener("mouseleave", () => (btn.style.background = "#f6fafd"));
}

/* End of file */
