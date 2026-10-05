// ========================================
// TASK SYSTEM
// ========================================

const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const completedCount = document.getElementById("completedCount");

function updateTaskCount() {

    const completed =
        document.querySelectorAll(
            '.task input[type="checkbox"]:checked'
        ).length;

    completedCount.textContent = completed;
}


document.querySelectorAll(".task input").forEach(input => {

    input.addEventListener("change", function () {

        const taskText =
            this.parentElement.querySelector("span");

        if (this.checked) {
            taskText.style.textDecoration = "line-through";
            taskText.style.color = "#aaa";
        } else {
            taskText.style.textDecoration = "none";
            taskText.style.color = "#20202b";
        }

        updateTaskCount();
    });

});


addTaskBtn.addEventListener("click", function () {

    const taskName = prompt("Enter your task:");

    if (!taskName || taskName.trim() === "") {
        return;
    }

    const task = document.createElement("div");

    task.className = "task";

    task.innerHTML = `
        <label>
            <input type="checkbox">
            <span>${taskName}</span>
        </label>

        <span class="task-time">
            New
        </span>
    `;

    taskList.appendChild(task);

    const checkbox =
        task.querySelector("input");

    checkbox.addEventListener("change", function () {

        const text =
            task.querySelector("label span");

        if (this.checked) {
            text.style.textDecoration = "line-through";
            text.style.color = "#aaa";
        } else {
            text.style.textDecoration = "none";
            text.style.color = "#20202b";
        }

        updateTaskCount();
    });

});


// ========================================
// POMODORO TIMER
// ========================================

let timeLeft = 25 * 60;
let timerInterval = null;

const timerDisplay =
    document.getElementById("timerDisplay");

const startTimer =
    document.getElementById("startTimer");

const resetTimer =
    document.getElementById("resetTimer");


function updateTimerDisplay() {

    const minutes =
        Math.floor(timeLeft / 60);

    const seconds =
        timeLeft % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


startTimer.addEventListener("click", function () {

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;

        startTimer.textContent = "Start";

        return;
    }

    startTimer.textContent = "Pause";

    timerInterval = setInterval(() => {

        if (timeLeft <= 0) {

            clearInterval(timerInterval);

            timerInterval = null;

            alert("🎉 Focus session completed!");

            startTimer.textContent = "Start";

            timeLeft = 25 * 60;

            updateTimerDisplay();

            return;
        }

        timeLeft--;

        updateTimerDisplay();

    }, 1000);

});


resetTimer.addEventListener("click", function () {

    clearInterval(timerInterval);

    timerInterval = null;

    timeLeft = 25 * 60;

    updateTimerDisplay();

    startTimer.textContent = "Start";

});


// ========================================
// SEARCH
// ========================================

const searchInput =
    document.getElementById("searchInput");


searchInput.addEventListener("input", function () {

    const search =
        this.value.toLowerCase();

    const tasks =
        document.querySelectorAll(".task");

    tasks.forEach(task => {

        const text =
            task.innerText.toLowerCase();

        if (text.includes(search)) {
            task.style.display = "flex";
        } else {
            task.style.display = "none";
        }

    });

});


// ========================================
// INITIALIZE
// ========================================

updateTaskCount();
updateTimerDisplay();