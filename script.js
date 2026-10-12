
(() => {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  const STORE = {
    tasks: "studentHub.tasks.v2",
    focus: "studentHub.focusSeconds.v1",
    timer: "studentHub.timerSeconds.v1",
    days: "studentHub.studyDays.v1"
  };

  const taskList = $("#taskList");
  const addBtn = $("#addTaskBtn");
  const countEl = $("#completedCount");
  const search = $("#searchInput");
  const timerDisplay = $("#timerDisplay");
  const startBtn = $("#startTimer");
  const resetBtn = $("#resetTimer");
  const countdown = $("#countdown");

  const FOCUS_TIME = 25 * 60;
  let timerSeconds = readNumber(STORE.timer, FOCUS_TIME);
  timerSeconds = Math.min(FOCUS_TIME, timerSeconds);
  let focusSeconds = readNumber(STORE.focus, 0);
  let timerInterval = null;
  let running = false;
  let filter = "all";
  let toastTimeout;

  function readNumber(key, fallback) {
    try {
      const n = Number(localStorage.getItem(key));
      return Number.isFinite(n) && n >= 0 ? n : fallback;
    } catch {
      return fallback;
    }
  }

  function load(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      toast("Could not save data in this browser.");
    }
  }

  function toast(message) {
    let el = $("#studentHubToast");

    if (!el) {
      el = document.createElement("div");
      el.id = "studentHubToast";
      el.setAttribute("role", "status");
      Object.assign(el.style, {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: "9999",
        background: "#25243a",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: "10px",
        boxShadow: "0 6px 20px #0002",
        font: "14px system-ui"
      });
      document.body.appendChild(el);
    }

    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      el.hidden = true;
    }, 2500);
  }

  // ---------- TASKS ----------

  function getInitialTasks() {
    if (!taskList) return [];

    return $$(".task", taskList).map((el, i) => ({
      id: `initial-${i}`,
      title: ($("label span", el) || $("label", el))
        ?.textContent.trim() || "Untitled task",
      time: $(".task-time", el)?.textContent.trim() || "New",
      completed: Boolean($('input[type="checkbox"]', el)?.checked)
    }));
  }

  let tasks = load(STORE.tasks, null);

  if (!Array.isArray(tasks)) {
    tasks = getInitialTasks();
    save(STORE.tasks, tasks);
  }

  function saveTasks() {
    save(STORE.tasks, tasks);
  }

  function taskDialog(existing = null) {
    const backdrop = document.createElement("div");
    Object.assign(backdrop.style, {
      position: "fixed",
      inset: "0",
      zIndex: "10000",
      background: "#17152b88",
      display: "grid",
      placeItems: "center",
      padding: "20px"
    });

    const form = document.createElement("form");
    Object.assign(form.style, {
      background: "#fff",
      color: "#25243a",
      padding: "24px",
      borderRadius: "16px",
      width: "min(380px, 100%)",
      boxSizing: "border-box",
      fontFamily: "system-ui"
    });

    const heading = document.createElement("h2");
    heading.textContent = existing ? "Edit task" : "Add a task";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 120;
    input.required = true;
    input.placeholder = "Enter task name";
    input.value = existing?.title || "";
    Object.assign(input.style, {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px",
      margin: "10px 0",
      border: "1px solid #ddd",
      borderRadius: "8px"
    });

    const select = document.createElement("select");
    [
      ["New", "Not set"],
      ["15 min", "15 minutes"],
      ["30 min", "30 minutes"],
      ["45 min", "45 minutes"],
      ["1 hr", "1 hour"],
      ["2 hrs", "2 hours"]
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
    select.value = existing?.time || "New";
    select.style.padding = "10px";

    const actions = document.createElement("div");
    actions.style.cssText =
      "display:flex;gap:8px;justify-content:flex-end;margin-top:16px";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancel";

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = existing ? "Save changes" : "Add task";

    [cancel, submit].forEach(button => {
      button.style.cssText =
        "padding:10px 14px;border:0;border-radius:8px;cursor:pointer";
    });
    submit.style.background = "#6557d9";
    submit.style.color = "#fff";

    actions.append(cancel, submit);
    form.append(heading, input, select, actions);
    backdrop.appendChild(form);
    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();

    cancel.addEventListener("click", close);
    backdrop.addEventListener("click", e => {
      if (e.target === backdrop) close();
    });

    form.addEventListener("submit", e => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) return;

      if (existing) {
        existing.title = title;
        existing.time = select.value;
      } else {
        tasks.unshift({
          id: crypto.randomUUID
            ? crypto.randomUUID()
            : `task-${Date.now()}`,
          title,
          time: select.value,
          completed: false
        });
      }

      saveTasks();
      renderTasks();
      close();
      toast(existing ? "Task updated." : "Task added.");
    });

    input.focus();
  }

  function renderTasks() {
    if (!taskList) return;

    taskList.replaceChildren();
    const query = (search?.value || "").trim().toLowerCase();
    let visible = 0;

    tasks.forEach(task => {
      const matchesText =
        `${task.title} ${task.time}`.toLowerCase().includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && !task.completed) ||
        (filter === "completed" && task.completed);

      const row = document.createElement("div");
      row.className = "task";
      if (task.completed) row.classList.add("completed-task");

      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;

      const text = document.createElement("span");
      text.textContent = task.title;

      if (task.completed) text.style.textDecoration = "line-through";

      label.append(checkbox, text);

      const time = document.createElement("span");
      time.className = "task-time";
      time.textContent = task.time || "New";

      const actions = document.createElement("span");
      actions.style.cssText = "display:inline-flex;gap:6px;margin-left:8px";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => taskDialog(task));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        if (!confirm(`Delete "${task.title}"?`)) return;
        tasks = tasks.filter(item => item.id !== task.id);
        saveTasks();
        renderTasks();
        toast("Task deleted.");
      });

      actions.append(edit, remove);
      row.append(label, time, actions);

      if (!matchesText || !matchesFilter) {
        row.hidden = true;
      } else {
        visible++;
      }

      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
      });

      taskList.appendChild(row);
    });

    if (!visible) {
      const empty = document.createElement("p");
      empty.textContent = query
        ? "No matching tasks found."
        : "No tasks here yet.";
      taskList.appendChild(empty);
    }

    if (countEl) {
      countEl.textContent = String(
        tasks.filter(task => task.completed).length
      );
    }
  }

  if (addBtn) {
    addBtn.addEventListener("click", () => taskDialog());
  }

  if (search) {
    search.addEventListener("input", () => {
      renderTasks();
      filterSubjects();
    });
  }

  // ---------- TASK FILTER ----------

  const filterBtn = $(".filter-btn");

  if (filterBtn) {
    const menu = document.createElement("div");
    menu.style.cssText =
      "position:absolute;z-index:20;background:white;padding:8px;border-radius:10px;box-shadow:0 4px 18px #0002";

    [
      ["all", "All tasks"],
      ["pending", "Pending"],
      ["completed", "Completed"]
    ].forEach(([value, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.style.cssText =
        "display:block;width:100%;padding:8px;border:0;background:white;text-align:left;cursor:pointer";

      button.addEventListener("click", () => {
        filter = value;
        menu.hidden = true;
        renderTasks();
      });

      menu.appendChild(button);
    });

    filterBtn.style.position = "relative";
    filterBtn.appendChild(menu);
    menu.hidden = true;

    filterBtn.addEventListener("click", e => {
      if (e.target.closest("div") === menu) return;
      menu.hidden = !menu.hidden;
    });

    document.addEventListener("click", e => {
      if (!filterBtn.contains(e.target)) menu.hidden = true;
    });
  }

  // ---------- POMODORO TIMER ----------

  function formatTime(seconds) {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const remaining = String(seconds % 60).padStart(2, "0");
    return `${minutes}:${remaining}`;
  }

  function renderTimer() {
    if (timerDisplay) timerDisplay.textContent = formatTime(timerSeconds);

    if (startBtn) {
      startBtn.textContent = running
        ? "Pause"
        : timerSeconds < FOCUS_TIME ? "Resume" : "Start";
    }
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    running = false;
  }

  function startTimer() {
    if (running) {
      stopTimer();
      save(STORE.timer, timerSeconds);
      renderTimer();
      toast("Timer paused.");
      return;
    }

    if (timerSeconds <= 0) timerSeconds = FOCUS_TIME;

    running = true;
    renderTimer();

    timerInterval = setInterval(() => {
      timerSeconds--;
      renderTimer();

      if (timerSeconds % 5 === 0) {
        save(STORE.timer, timerSeconds);
      }

      if (timerSeconds <= 0) {
        stopTimer();
        timerSeconds = 0;
        save(STORE.timer, timerSeconds);

        focusSeconds += FOCUS_TIME;
        save(STORE.focus, focusSeconds);
        markStudyDay();
        updateStudyHours();
        renderTimer();

        toast("Focus session complete! Take a break.");

        if ("Notification" in window &&
            Notification.permission === "granted") {
          new Notification("StudentHub", {
            body: "Your study session is complete!"
          });
        }
      }
    }, 1000);
  }

  function resetTimer() {
    stopTimer();
    timerSeconds = FOCUS_TIME;
    save(STORE.timer, timerSeconds);
    renderTimer();
    toast("Timer reset.");
  }

  if (startBtn) startBtn.addEventListener("click", startTimer);
  if (resetBtn) resetBtn.addEventListener("click", resetTimer);

  renderTimer();

  // ---------- STUDY STATISTICS ----------

  function updateStudyHours() {
    const card = $$(".stat-card").find(el =>
      /study hours/i.test(el.textContent)
    );
    const value = card?.querySelector("h2");

    if (value) {
      const hours = focusSeconds / 3600;
      value.textContent = `${hours.toFixed(1)}h`;
    }
  }

  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function markStudyDay() {
    const days = load(STORE.days, []);
    const today = dateKey(new Date());

    if (!days.includes(today)) days.push(today);

    save(STORE.days, days);
    renderStreak(days);
  }

  function renderStreak(days = load(STORE.days, [])) {
    const card = $$(".stat-card").find(el =>
      /study streak/i.test(el.textContent)
    );
    const value = card?.querySelector("h2");
    if (!value) return;

    let streak = 0;
    const date = new Date();

    while (days.includes(dateKey(date))) {
      streak++;
      date.setDate(date.getDate() - 1);
    }

    value.textContent = `${streak} ${streak === 1 ? "Day" : "Days"}`;
  }

  // ---------- SEARCH SUBJECTS ----------

  function filterSubjects() {
    if (!search) return;
    const query = search.value.trim().toLowerCase();

    $$(".subject").forEach(subject => {
      subject.hidden =
        Boolean(query) &&
        !subject.textContent.toLowerCase().includes(query);
    });
  }

  // ---------- DATE AND EXAM COUNTDOWN ----------

  const dateText = $(".welcome-row .small-text");

  if (dateText) {
    dateText.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(new Date());
  }

  if (countdown) {
    const examText = $(".exam-date")?.textContent || "";
    const match = examText.match(
      /([A-Za-z]+\s+\d{1,2},\s*\d{4})/
    );

    if (match) {
      const examDate = new Date(`${match[1]} 23:59:59`);

      if (!Number.isNaN(examDate.getTime())) {
        const days = Math.ceil(
          (examDate.getTime() - Date.now()) / 86400000
        );

        countdown.textContent =
          days > 1 ? `${days} Days` :
          days === 1 ? "1 Day" :
          days === 0 ? "Today!" : "Date passed";
      }
    }
  }

  // ---------- BROWSER NOTIFICATIONS ----------

  const notificationBtn = $(".notification");

  if (notificationBtn) {
    notificationBtn.addEventListener("click", async () => {
      if (!("Notification" in window)) {
        toast("Browser notifications are not supported.");
        return;
      }

      if (Notification.permission === "granted") {
        toast("Notifications are already enabled.");
        return;
      }

      if (Notification.permission === "denied") {
        toast("Allow notifications in browser settings.");
        return;
      }

      const permission = await Notification.requestPermission();
      toast(
        permission === "granted"
          ? "Notifications enabled."
          : "Notifications not enabled."
      );
    });
  }

  // ---------- INITIALIZE ----------

  updateStudyHours();
  renderStreak();
  renderTasks();
})();
