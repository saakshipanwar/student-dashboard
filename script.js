
 // ========================================
 // TASK SYSTEM - SECURE VERSION
 // ========================================

const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const completedCount = document.getElementById("completedCount");

function updateTaskCount() {
    const completed = taskList.querySelectorAll(
        '.task input[type="checkbox"]:checked'
    ).length;

    completedCount.textContent = completed;
}

function updateTaskStyle(checkbox) {
    const taskText = checkbox.parentElement.querySelector("span");

    if (!taskText) return;

    if (checkbox.checked) {
        taskText.style.textDecoration = "line-through";
        taskText.style.color = "#aaa";
    } else {
        taskText.style.textDecoration = "none";
        taskText.style.color = "#20202b";
    }
}

// Existing tasks ke checkbox handlers
taskList.querySelectorAll('.task input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        updateTaskStyle(this);
        updateTaskCount();
    });
});

addTaskBtn.addEventListener("click", function () {
    const taskName = prompt("Enter your task:");

    if (taskName === null || taskName.trim() === "") {
        return;
    }

    // Task container
    const task = document.createElement("div");
    task.className = "task";

    // Label
    const label = document.createElement("label");

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    // Safe text insertion: HTML execute nahi hoga
    const text = document.createElement("span");
    text.textContent = taskName.trim();

    // Task time
    const taskTime = document.createElement("span");
    taskTime.className = "task-time";
    taskTime.textContent = "New";

    // Elements ko assemble karo
    label.appendChild(checkbox);
    label.appendChild(text);

    task.appendChild(label);
    task.appendChild(taskTime);

    taskList.appendChild(task);

    checkbox.addEventListener("change", function () {
        updateTaskStyle(this);
        updateTaskCount();
    });

    updateTaskCount();
});

// Initial count
updateTaskCount();
