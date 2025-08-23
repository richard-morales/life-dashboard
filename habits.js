// ============================================================
// Habit Clock — JavaScript Logic
// ------------------------------------------------------------
// Handles: adding habits, calculating durations, rendering
// habit clocks, and persisting data in localStorage.
// ============================================================

// ------------------------------------------------------------
// DOM References
// ------------------------------------------------------------
const habitsForm = document.getElementById("habits-form");
const habitsGallery = document.getElementById("habits-gallery");
const habitsSection = document.getElementById("habits-clocks-section");
const descInput = document.getElementById("habit-description");
const dateInput = document.getElementById("habit-date");

// In-memory array of habits [{ desc: string, date: YYYY-MM-DD }]
let habits = [];

// ------------------------------------------------------------
// Date Utilities
// ------------------------------------------------------------

/**
 * Parse a `YYYY-MM-DD` string into a Date object set at local midnight.
 * Avoids the UTC shift bug of `new Date(string)` in some browsers.
 */
function parseLocalDate(iso) {
  const parts = iso.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Return the whole-day difference between start date and today.
 * Clamps to zero if the start date is in the future.
 */
function daysTotal(startIso) {
  const ONE_DAY = 1000 * 60 * 60 * 24;
  const start = parseLocalDate(startIso);
  const now = new Date();

  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffMs = now - start;
  return diffMs > 0 ? Math.floor(diffMs / ONE_DAY) : 0;
}

/**
 * Compute how many full years, months, and days
 * have passed between the start date and today.
 */
function calculateDuration(startIso) {
  const start = parseLocalDate(startIso);
  const now = new Date();

  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

// ------------------------------------------------------------
// Formatting Utilities
// ------------------------------------------------------------

/**
 * Escape < > & " ' characters to prevent HTML injection
 * in user-supplied habit descriptions.
 */
function escapeHTML(str) {
  return str.replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[ch])
  );
}

/**
 * Turn numeric years/months/days into a human-readable string.
 * Handles pluralization (e.g., "1 year", "2 months").
 */
function formatDuration({ years, months, days }) {
  const parts = [];
  if (years > 0) parts.push(years === 1 ? "one year" : `${years} years`);
  if (months > 0) parts.push(months === 1 ? "one month" : `${months} months`);
  parts.push(days === 1 ? "one day" : `${days} days`);
  return parts.join(" ");
}

/**
 * Show the start date as a localized full date, e.g., July 27, 2025.
 */
function formatStartDate(startIso) {
  const d = parseLocalDate(startIso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ------------------------------------------------------------
// Persistence (localStorage)
// ------------------------------------------------------------

/** Load any saved habits into memory. */
function loadHabits() {
  const json = localStorage.getItem("habits");
  habits = json ? JSON.parse(json) : [];
}

/** Persist current habits array back to localStorage. */
function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

// ------------------------------------------------------------
// Render Function
// ------------------------------------------------------------

/**
 * Rebuild the habits gallery:
 * - If empty, hide the section
 * - Otherwise, render each habit as a clock card
 */
function renderHabits() {
  habitsGallery.innerHTML = "";

  if (habits.length === 0) {
    habitsSection.style.display = "none";
    return;
  }
  habitsSection.style.display = "";

  habits.forEach((habit, idx) => {
    const totalDays = daysTotal(habit.date);
    const duration = calculateDuration(habit.date);

    const li = document.createElement("li");
    li.className = "habit-clock";

    li.innerHTML = `
      <div class="clock-container">
        <img
          src="assets/images/widgets/frames/ornate-habit-tracker-frame.svg"
          alt="Clock Frame"
          class="clock-frame"
        />
        <div class="habit-days">${totalDays}</div>
      </div>
      <p class="habit-label">
        Days of: <strong>${escapeHTML(habit.desc)}</strong>
      </p>
      <div class="habit-duration">
        ${formatDuration(duration)}
      </div>
      <div class="habit-started">
        Started on: ${formatStartDate(habit.date)}
      </div>
      <button
        class="delete-habit"
        title="Delete habit and reset clock"
        aria-label="Delete habit"
      >
        <i class="fa-solid fa-square-xmark"></i>
      </button>
    `;

    // Delete button handler
    li.querySelector(".delete-habit").onclick = () => {
      habits.splice(idx, 1);
      saveHabits();
      renderHabits();
    };

    habitsGallery.appendChild(li);
  });
}

// ------------------------------------------------------------
// Event: Add New Habit
// ------------------------------------------------------------
habitsForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const desc = descInput.value.trim();
  const date = dateInput.value;
  if (!desc || !date) return; // Guard: require valid inputs

  habits.push({ desc, date });
  saveHabits();
  renderHabits();
  habitsForm.reset();
});

// ------------------------------------------------------------
// Initial Load
// ------------------------------------------------------------
loadHabits();
renderHabits();
