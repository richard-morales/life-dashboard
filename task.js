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
    newTask.textContent = taskText;

    // Add task to the list
    taskList.appendChild(newTask);

    // Apply styling class
newTask.classList.add("task-item");

    // Clear input field
taskInput.value = "";

}
});


