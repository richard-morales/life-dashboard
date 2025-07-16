// --- Helper Functions ---

function saveGoals() {
  localStorage.setItem("weeklyGoals", JSON.stringify(goals));
}
function loadGoals() {
  const stored = localStorage.getItem("weeklyGoals");
  return stored ? JSON.parse(stored) : [];
}
function getYearWeek(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-${weekNo}`;
}

// --- DOM References ---
const form = document.getElementById("goals-form");
const descriptionInput = document.getElementById("goal-description");
const targetInput = document.getElementById("goal-target");
const unitSelect = document.getElementById("unit-measure");
const customUnitInput = document.getElementById("custom-unit");
const goalsList = document.getElementById("goals-list");

// --- Show/hide custom unit field ---
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

// --- Weekly Reset Logic ---
const currentYearWeek = getYearWeek();
const lastReset = localStorage.getItem("goalsLastReset");

let goals = loadGoals();

if (lastReset !== currentYearWeek) {
  goals.forEach((goal) => {
    goal.progress = {};
  });
  saveGoals();
  localStorage.setItem("goalsLastReset", currentYearWeek);
}

// --- Render Goals List ---
function renderGoals() {
  goalsList.innerHTML = "";
  const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayStr = WEEKDAYS[new Date().getDay()];

  goals.forEach((goal, idx) => {
    // Progress checkboxes (only today enabled)
    const progressRow = goal.days
      .map((day) => {
        const checked = goal.progress && goal.progress[day] ? "checked" : "";
        const label = day.charAt(0).toUpperCase() + day.slice(1);
        const isToday = day === todayStr;
        const disabled = isToday ? "" : "disabled";
        const tooltip = isToday
          ? ""
          : 'title="You can only mark your goal for today"';
        const labelClass = isToday ? "" : "label-disabled";
        return `
        <label class="${labelClass}" style="margin-right:8px;" data-goal="${idx}" data-day="${day}">
          <input type="checkbox" class="progress-checkbox" data-goal="${idx}" data-day="${day}" ${checked} ${disabled} ${tooltip}>
          ${label}
        </label>
      `;
      })
      .join("");

    // Daily motivational feedback
    const isTodayGoal = goal.days.includes(todayStr);
    const todayChecked = goal.progress && goal.progress[todayStr];
    const dailyFeedback =
      isTodayGoal && todayChecked
        ? `<span class="daily-feedback" style="color: #39924c; margin-left: 0.5em;">Great job! You completed today!</span>`
        : "";

    // Progress bar calculatio
    const completedCount = goal.days.filter(
      (day) => goal.progress && goal.progress[day]
    ).length;
    const percent =
      goal.days.length > 0
        ? Math.round((completedCount / goal.days.length) * 100)
        : 0;
    const progressBarHTML = `
      <div class="progress-bar-container" style="margin: 0.5em 0;">
        <div class="progress-bar-bg" style="background:#e0e0e0; border-radius:8px; width:100%; height:16px;">
          <div class="progress-bar-fill" style="
            background: #81c784; 
            width: ${percent}%; 
            height: 100%; 
            border-radius:8px;
            transition: width 0.3s;
          "></div>
        </div>
        <span class="progress-bar-label" style="font-size:0.95em; color:#607d8b;">${completedCount} of ${goal.days.length} days (${percent}%)</span>
      </div>
    `;

    // Weekly completion feedback
    const isGoalComplete =
      goal.days.length > 0 &&
      goal.days.every((day) => goal.progress && goal.progress[day]);
    const goalHighlight = isGoalComplete ? "goal-completed" : "";
    const completionMsg = isGoalComplete
      ? `<div class="weekly-feedback" style="color: #39924c; font-weight: bold; margin-top: 0.3em;">🏆 Goal achieved for this week!</div>`
      : "";

    // Render goal item
    const li = document.createElement("li");
    li.className = "goal-item " + goalHighlight;
    li.innerHTML = `
      <strong>${goal.description}</strong>
      <span>Target: ${goal.target} ${goal.unit}</span>
      <div>Progress: ${progressRow} ${dailyFeedback}</div>
      ${progressBarHTML}
      ${completionMsg}
      <button class="delete-goal" data-index="${idx}" aria-label="Delete goal" style="margin-top:0.5em;">
        <i class="fa fa-trash"></i>
      </button>
    `;
    goalsList.appendChild(li);
  });

  // --- Add delete event listeners ---
  goalsList.querySelectorAll(".delete-goal").forEach((btn) => {
    btn.addEventListener("click", function () {
      const idx = parseInt(this.dataset.index, 10);
      goals.splice(idx, 1);
      saveGoals();
      renderGoals();
    });
  });

  // --- Add progress checkbox listeners ---
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

  // --- Add disabled label animation/inline feedback ---
  goalsList.querySelectorAll(".label-disabled").forEach((label) => {
    label.addEventListener("click", function (e) {
      // Animate the label with shake
      label.classList.remove("shake");
      void label.offsetWidth;
      label.classList.add("shake");
      // Show inline message
      showInlineMessage(label, "Only today's progress can be marked.");
    });
  });
}

// Helper function to show a temporary inline message
function showInlineMessage(label, msg) {
  // Remove any existing message
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

// --- Add New Goal ---
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

  // Require at least one weekday
  if (days.length === 0) {
    alert("Please select at least one weekday for your goal.");
    return;
  }

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
  // Hide custom unit input if form is reset
  customUnitInput.style.display = "none";
  customUnitInput.required = false;
});

// --- Initial Render ---
renderGoals();
