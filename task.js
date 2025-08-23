// =============================================================
// Task Manager Widget (task.js)
// -------------------------------------------------------------
// Features:
// - Add tasks with a text input
// - Mark tasks as completed by clicking the text
// - Delete tasks individually
// - Persist tasks (with completion state) to localStorage
// - Reload and render saved tasks on page load
// =============================================================

// --- DOM References ---
const taskForm = document.querySelector(".task-form");
const taskInput = taskForm.querySelector("input[name='task']");
const taskList = document.getElementById("task-list");

// --- Local Storage Helpers ---

/**
 * Save the current array of tasks to localStorage.
 * @param {Array<{text:string, completed:boolean}>} tasks
 */
function saveTasksToLocalStorage(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * Load tasks array from localStorage, or return [] if none.
 * @returns {Array<{text:string, completed:boolean}>}
 */
function loadTasksFromLocalStorage() {
  const stored = localStorage.getItem("tasks");
  return stored ? JSON.parse(stored) : [];
}

// --- Add New Task ---

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const taskText = taskInput.value.trim();
  if (taskText != "") {
    // Create task <li> with text + delete button
    const newTask = document.createElement("li");
    newTask.classList.add("task-item");

    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = taskText;
    taskTextSpan.classList.add("task-text");

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.classList.add("delete-task");

    // Toggle completion on text click
    taskTextSpan.addEventListener("click", () => {
      newTask.classList.toggle("completed");

      // Persist updated completion state
      const updatedTasks = loadTasksFromLocalStorage().map((t) =>
        t.text === taskText
          ? { ...t, completed: newTask.classList.contains("completed") }
          : t
      );
      saveTasksToLocalStorage(updatedTasks);
    });

    // Delete task
    deleteBtn.addEventListener("click", () => {
      taskList.removeChild(newTask);
      const updatedTasks = loadTasksFromLocalStorage().filter(
        (t) => t.text !== taskText
      );
      saveTasksToLocalStorage(updatedTasks);
    });

    // Build and append the new <li>
    newTask.appendChild(taskTextSpan);
    newTask.appendChild(deleteBtn);
    taskList.appendChild(newTask);

    // Save as new task (incomplete by default)
    const currentTasks = loadTasksFromLocalStorage();
    currentTasks.push({
      text: taskText,
      completed: false,
    });
    saveTasksToLocalStorage(currentTasks);

    // Clear input for next task
    taskInput.value = "";
  }
});

// --- Load & Render Existing Tasks on Page Load ---

window.addEventListener("DOMContentLoaded", () => {
  const storedTasks = loadTasksFromLocalStorage();

  storedTasks.forEach((task) => {
    const newTask = document.createElement("li");
    newTask.classList.add("task-item");
    if (task.completed) {
      newTask.classList.add("completed");
    }

    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = task.text;
    taskTextSpan.classList.add("task-text");

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.classList.add("delete-task");

    // Toggle completion
    taskTextSpan.addEventListener("click", () => {
      newTask.classList.toggle("completed");

      const updatedTasks = loadTasksFromLocalStorage().map((t) =>
        t.text === task.text
          ? { ...t, completed: newTask.classList.contains("completed") }
          : t
      );
      saveTasksToLocalStorage(updatedTasks);
    });

    // Delete task
    deleteBtn.addEventListener("click", () => {
      taskList.removeChild(newTask);
      const updatedTasks = loadTasksFromLocalStorage().filter(
        (t) => t.text !== task.text
      );
      saveTasksToLocalStorage(updatedTasks);
    });

    newTask.appendChild(taskTextSpan);
    newTask.appendChild(deleteBtn);
    taskList.appendChild(newTask);
  });
});
