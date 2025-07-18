const addBtn = document.getElementById("add-task");
const micBtn = document.getElementById("mic");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// 🎤 Speech input handling
recognition.onresult = function(event) {
  const transcript = event.results[0][0].transcript;
  input.value = transcript;
};

micBtn.addEventListener("click", () => {
  micBtn.classList.add("recording");
  recognition.start();
});

recognition.onend = function () {
  micBtn.classList.remove("recording");
};

// ✅ Toggle Instructions
window.addEventListener("DOMContentLoaded", () => {
  const helpBtn = document.getElementById("helpBtn");
  const instructions = document.getElementById("instructions");

helpBtn.addEventListener("click", () => {
  instructions.classList.toggle("hidden");

  if (instructions.classList.contains("hidden")) {
    helpBtn.textContent = "How to Use";
  } else {
    helpBtn.textContent = "🔽 Hide Instructions";
  }
});

const darkToggle = document.getElementById("darkModeToggle");

darkToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark", darkToggle.checked);
});


});


// ✅ Load tasks when page loads
window.addEventListener("load", loadTasks);

addBtn.addEventListener("click", addTask);

function addTask() {
  const taskText = input.value.trim();
  if (taskText === "") return;

  const task = { text: taskText, completed: false };
  const tasks = getTasksFromStorage();
  tasks.push(task);
  saveTasksToStorage(tasks);
  input.value = "";
  renderTasks(tasks);
}

function renderTasks(tasks) {
  list.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    if (task.completed) li.classList.add("completed");

    li.innerHTML = `
      <span>${task.text}</span>
      <button class="delete-btn">❌</button>
    `;

    // Toggle complete
    li.querySelector("span").addEventListener("click", () => {
      task.completed = !task.completed;
      saveTasksToStorage(tasks);
      renderTasks(tasks);
    });

    // Delete
    li.querySelector("button").addEventListener("click", () => {
      tasks.splice(index, 1);
      saveTasksToStorage(tasks);
      renderTasks(tasks);
    });

    list.appendChild(li);
  });
}

function saveTasksToStorage(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function getTasksFromStorage() {
  const data = localStorage.getItem("tasks");
  return data ? JSON.parse(data) : [];
}

function loadTasks() {
  const tasks = getTasksFromStorage();
  renderTasks(tasks);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("Service Worker registered!", reg))
      .catch(err => console.error("Service Worker registration failed:", err));
  });
}
function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById("liveClock");
  clockEl.textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();
