// Grab the form, the list container, the section wrapper,
// and the two form inputs
const habitsForm = document.getElementById("habits-form");
const habitsGallery = document.getElementById("habits-gallery");
const habitsSection = document.getElementById("habits-clocks-section");
const descInput = document.getElementById("habit-description");
const dateInput = document.getElementById("habit-date");

// In-memory array of habits (each an object with desc and date)
let habits = [];

/*
  Parse a `YYYY-MM-DD` string into a Date at local midnight
  (avoids the UTC shift that `new Date(string)` can introduce)
 */
function parseLocalDate(iso) {
  const parts = iso.split("-").map(Number);
  // year, monthIndex, day
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/*
  For security, escape any < > & " ' that might appear
  in the habit description
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

/*
  Return the whole-day difference between startDate and today,
  clamped at zero for any future date or today => zero
 */
function daysTotal(startIso) {
  const ONE_DAY = 1000 * 60 * 60 * 24;
  const start = parseLocalDate(startIso);
  const now = new Date();

  // Zero out hours/minutes/seconds so we compare whole days
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffMs = now - start;
  return diffMs > 0 ? Math.floor(diffMs / ONE_DAY) : 0;
}

/*
  Compute how many full years, months, and days
  have passed between the start date and today
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
    // Days in the previous (calendar) month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

/*
  Turn numeric years/months/days into a human string
  with proper singular or plural units
 */
function formatDuration({ years, months, days }) {
  const parts = [];
  if (years > 0) {
    parts.push(years === 1 ? "one year" : years + " years");
  }
  if (months > 0) {
    parts.push(months === 1 ? "one month" : months + " months");
  }
  // Always show days (even zero)
  parts.push(days === 1 ? "one day" : days + " days");
  return parts.join(" ");
}

/*
  Show the start date as e.g. July 27, 2025
 */
function formatStartDate(startIso) {
  const d = parseLocalDate(startIso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/*
  Load any saved habits from localStorage
  into our in-memory array
 */
function loadHabits() {
  const json = localStorage.getItem("habits");
  habits = json ? JSON.parse(json) : [];
}

/*
  Persist our in-memory array back to localStorage
 */
function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

/*
  Rebuild the list of habit clocks on screen
 */
function renderHabits() {
  // Clear existing
  habitsGallery.innerHTML = "";

  // If no habits, hide entire section
  if (habits.length === 0) {
    habitsSection.style.display = "none";
    return;
  }
  habitsSection.style.display = "";

  // For each habit, build its card
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

    // Wire up deletion
    li.querySelector(".delete-habit").onclick = () => {
      habits.splice(idx, 1);
      saveHabits();
      renderHabits();
    };

    habitsGallery.appendChild(li);
  });
}

/*
  Handle the form "add new habit" event
 */
habitsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const desc = descInput.value.trim();
  const date = dateInput.value;
  if (!desc || !date) return;

  habits.push({ desc, date });
  saveHabits();
  renderHabits();
  habitsForm.reset();
});

// Initial setup on page load
loadHabits();
renderHabits();
