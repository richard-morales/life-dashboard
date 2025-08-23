// ============================================================
// Weekly Goals — JavaScript Logic
// ------------------------------------------------------------
// Handles: goal creation, progress tracking, weekly resets,
// rendering with progress bars, and persistence via localStorage.
// ============================================================

// ------------------------------------------------------------
// Persistence Helpers (localStorage)
// ------------------------------------------------------------
function saveGoals() {
  localStorage.setItem("weeklyGoals", JSON.stringify(goals));
}
function loadGoals() {
  const stored = localStorage.getItem("weeklyGoals");
  return stored ? JSON.parse(stored) : [];
}

// ------------------------------------------------------------
// Week Calculation Helper
// ------------------------------------------------------------
// Returns a string like "2025-34" for Year-Week number.
// Used to reset goals weekly based on ISO-like week logic.
function getYearWeek(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // 86,400,000 ms = 1 day. Adding 1 includes the first day of the first week.
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${weekNo}`;
}

// ------------------------------------------------------------
// DOM References
// ------------------------------------------------------------
const form = document.getElementById("goals-form");
const descriptionInput = document.getElementById("goal-description");
const targetInput = document.getElementById("goal-target");
const unitSelect = document.getElementById("unit-measure");
const customUnitInput = document.getElementById("custom-unit");
const goalsList = document.getElementById("goals-list");

// ------------------------------------------------------------
// Unit Selection — Toggle Custom Input
// ------------------------------------------------------------
unitSelect.addEventListener("change", function () {
  if (unitSelect.value === "custom") {
    customUnitInput.style.display = "block";
    customUnitInput.required = true;
  } else {
    customUnitInput.style.display = "none";
    customUnitInput.required = false;
    customUnitInput.value = "";
  }
});

// ------------------------------------------------------------
// Weekly Reset Logic
// ------------------------------------------------------------
// At the start of a new week, clear all progress checkmarks
// but preserve the goal definitions.
const currentYearWeek = getYearWeek();
const lastReset = localStorage.getItem("goalsLastReset");

let goals = loadGoals();
if (!Array.isArray(goals)) goals = [];

if (lastReset !== currentYearWeek) {
  goals.forEach((goal) => {
    goal.progress = {};
  });
  saveGoals();
  localStorage.setItem("goalsLastReset", currentYearWeek);
}

// ------------------------------------------------------------
// Helper: Today's Weekday (short format)
// ------------------------------------------------------------
function getTodayShort() {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[new Date().getDay()];
}

// ------------------------------------------------------------
// Render Goals
// ------------------------------------------------------------
// Builds the goals list UI with progress checkboxes, bars,
// feedback messages, and delete handlers.
function renderGoals() {
  const goalsList = document.getElementById("goals-list");
  const goalsSection = document.getElementById("goals-section");

  // Show/hide container depending on whether goals exist
  if (goals.length === 0) {
    goalsSection.style.display = "none";
    return;
  } else {
    goalsSection.style.display = "block";
  }

  goalsList.innerHTML = ""; // Clear previous render

  goals.forEach((goal, idx) => {
    // Build checkboxes for each selected day
    let checkboxes = "";
    goal.days.forEach((day) => {
      const checked = goal.progress && goal.progress[day] ? "checked" : "";
      const isToday = getTodayShort() === day;
      const disabled = isToday ? "" : "disabled";
      checkboxes += `
        <label class="${disabled ? "label-disabled" : ""}">
          <input type="checkbox" class="progress-checkbox" data-day="${day}" data-goal="${idx}" ${checked} ${disabled}>
          ${day.charAt(0).toUpperCase() + day.slice(1)}
        </label>
      `;
    });

    // Progress calculation
    const total = goal.days.length;
    const completed = goal.progress
      ? Object.values(goal.progress).filter(Boolean).length
      : 0;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    // Progress bar HTML
    const progressBar = `
      <div class="progress-bar-container">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${percent}%"></div>
        </div>
        <div class="progress-bar-label">${completed} of ${total} days (${percent}%)</div>
      </div>
    `;

    // Daily feedback
    const feedback =
      goal.progress && goal.progress[getTodayShort()]
        ? `<span class="good-news">Great job! You completed today!</span>`
        : "";

    // Build list item for goal
    const li = document.createElement("li");
    li.className = "goal-item";
    li.innerHTML = `
      <div class="goal-content">
        <div>
            <strong>${goal.description}</strong> <br> Target: ${goal.target} ${goal.unit}
          <div>Progress:<span id="progress-checkboxes"> ${checkboxes} </span> <br> ${feedback}</div>
          ${progressBar}
        </div>
        <button class="delete-goal" data-index="${idx}" aria-label="Delete goal">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    `;
    goalsList.appendChild(li);
  });

  // Attach delete event listeners
  goalsList.querySelectorAll(".delete-goal").forEach((btn) => {
    btn.addEventListener("click", function () {
      const idx = parseInt(this.dataset.index, 10);
      goals.splice(idx, 1);
      saveGoals();
      renderGoals();
    });
  });

  // Attach progress checkbox listeners
  goalsList.querySelectorAll(".progress-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const goalIdx = parseInt(this.dataset.goal, 10);
      const day = this.dataset.day;
      goals[goalIdx].progress = goals[goalIdx].progress || {};
      goals[goalIdx].progress[day] = this.checked;
      saveGoals();
      renderGoals();
    });
  });

  // Attach disabled label animation + inline feedback
  goalsList.querySelectorAll(".label-disabled").forEach((label) => {
    label.addEventListener("click", function () {
      // Animate with shake effect
      label.classList.remove("shake");
      void label.offsetWidth; // Force reflow
      label.classList.add("shake");
      // Show inline tooltip
      showInlineMessage(label, "Only today's progress can be marked.");
    });
  });
}

// ------------------------------------------------------------
// Inline Message Helper
// ------------------------------------------------------------
// Displays a temporary tooltip below a disabled day label.
function showInlineMessage(label, msg) {
  const existing = label.querySelector(".inline-message");
  if (existing) existing.remove();

  const span = document.createElement("span");
  span.className = "inline-message";
  span.textContent = msg;
  label.appendChild(span);

  setTimeout(() => {
    span.remove();
    label.classList.remove("shake");
  }, 2000);
}

// ------------------------------------------------------------
// Event: Add New Goal
// ------------------------------------------------------------
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const target = parseInt(targetInput.value, 10) || 0;
  let unit;
  if (unitSelect.value === "custom") {
    unit = customUnitInput.value.trim() || "unit";
  } else {
    unit = unitSelect.value;
  }

  const days = Array.from(
    form.querySelectorAll("input[type='checkbox'][name='days']:checked")
  ).map((cb) => cb.value);

  // Guard: require at least one weekday
  if (days.length === 0) {
    alert("Please select at least one weekday for your goal.");
    return;
  }

  // Build goal object
  const goal = {
    description,
    target,
    unit,
    days,
    progress: {},
    createdAt: new Date().toISOString(),
  };

  goals.push(goal);
  saveGoals();
  renderGoals();
  form.reset();

  // Reset custom unit visibility on form reset
  customUnitInput.style.display = "none";
  customUnitInput.required = false;
});

// ------------------------------------------------------------
// Initial Render
// ------------------------------------------------------------
renderGoals();
