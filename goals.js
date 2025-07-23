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
  // 86,400,000 ms = 1 day. Adding 1 includes the first day of the first week, shifting from zero-based to one-based counting.
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7); // Division and addition have the same precedence level, so this operation is evaluated from left to right (+ 1 occurs after the division).
  return `${d.getUTCFullYear()}-${weekNo}`; //  Result will be the week number of the current week, so we know which week we are currently in. right now.
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
if (!Array.isArray(goals)) goals = [];

if (lastReset !== currentYearWeek) {
  goals.forEach((goal) => {
    goal.progress = {};
  });
  saveGoals();
  localStorage.setItem("goalsLastReset", currentYearWeek);
}

// --- Helper: Get today's weekday in short ---
function getTodayShort() {
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[new Date().getDay()];
}

// --- Render Goals List ---
function renderGoals() {
  const goalsList = document.getElementById("goals-list");
  const goalsSection = document.getElementById("goals-section");

  // Show or hide the goals card
  if (goals.length === 0) {
    goalsSection.style.display = "none";
    return;
  } else {
    goalsSection.style.display = "block";
  }

  goalsList.innerHTML = ""; // Clear previous list

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

    // Calculate progress
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

    // Feedback message
    const feedback =
      goal.progress && goal.progress[getTodayShort()]
        ? `<span class="good-news">Great job! You completed today!</span>`
        : "";

    // Build the goal item HTML
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
