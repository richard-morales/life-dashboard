// Select elements from the DOM

const taskForm = document.querySelector(".task-form");
const taskInput = taskForm.querySelector("input[name='task']");
const taskList = document.getElementById("task-list");

// Handle form submission

taskForm.addEventListener("submit", function (event) {
  // Prevent page reload on submit
  event.preventDefault();

  // Get trimmed input value
  const taskText = taskInput.value.trim();

  // If input is not empty, create and add task
  if (taskText != "") {
    const newTask = document.createElement("li");
    newTask.classList.add("task-item");

    // Create a span for the task text
    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = taskText;
    taskTextSpan.classList.add("task-text");

    // Create delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.classList.add("delete-task");

    // Add click event to delete task
    deleteBtn.addEventListener("click", () => {
      taskList.removeChild(newTask);
    });

    // Toggle completed class on click
    taskTextSpan.addEventListener("click", () => {
      newTask.classList.toggle("completed");
    });

    // Append the span to the list item
    newTask.appendChild(taskTextSpan);

    // Append the delete button
    newTask.appendChild(deleteBtn);

    // Append task to the list
    taskList.appendChild(newTask);

    // Apply styling class
    newTask.classList.add("task-item");

    // Clear input field
    taskInput.value = "";
  }
});
