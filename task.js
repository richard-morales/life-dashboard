// Select elements from the DOM

const taskForm = document.querySelector(".task-form");
const taskInput = taskForm.querySelector("input[name='task']");
const taskList = document.getElementById("task-list");

// Save the task array to local storage
function saveTasksToLocalStorage(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Load tasks from local storage
function loadTasksFromLocalStorage() {
  const stored = localStorage.getItem("tasks");
  return stored ? JSON.parse(stored) : [];
}

// Handle form submission

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const taskText = taskInput.value.trim();
  if (taskText != "") {
    const newTask = document.createElement("li");
    newTask.classList.add("task-item");
    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = taskText;
    taskTextSpan.classList.add("task-text");
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.classList.add("delete-task");

    // Add click event to toggle completion and update localStorage
    taskTextSpan.addEventListener("click", () => {
      newTask.classList.toggle("completed");

      // Update completion in localStorage for this task
      const updatedTasks = loadTasksFromLocalStorage().map((t) =>
        t.text === taskText
          ? { ...t, completed: newTask.classList.contains("completed") }
          : t
      );
      saveTasksToLocalStorage(updatedTasks);
    });

    // Delete logic
    deleteBtn.addEventListener("click", () => {
      taskList.removeChild(newTask);
      const updatedTasks = loadTasksFromLocalStorage().filter(
        (t) => t.text !== taskText
      );
      saveTasksToLocalStorage(updatedTasks);
    });

    newTask.appendChild(taskTextSpan);
    newTask.appendChild(deleteBtn);
    taskList.appendChild(newTask);

    // Save to local storage as incomplete initially
    const currentTasks = loadTasksFromLocalStorage();
    currentTasks.push({
      text: taskText,
      completed: false,
    });
    saveTasksToLocalStorage(currentTasks);

    taskInput.value = "";
  }
});

// Load and display saved tasks on page load
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

    taskTextSpan.addEventListener("click", () => {
      newTask.classList.toggle("completed");

      const updatedTasks = loadTasksFromLocalStorage().map((t) =>
        t.text === task.text
          ? { ...t, completed: newTask.classList.contains("completed") }
          : t
      );
      saveTasksToLocalStorage(updatedTasks);
    });

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
