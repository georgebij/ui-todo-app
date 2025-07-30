// DOM Elements
const addBtn = document.getElementById("add-task");
const micBtn = document.getElementById("mic");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const helpBtn = document.getElementById("helpBtn");
const instructions = document.getElementById("instructions");
const darkToggle = document.getElementById("darkModeToggle");

const categorySelect = document.getElementById("category-select");
const newCategoryInput = document.getElementById("new-category-input");
const addCategoryBtn = document.getElementById("add-category-btn");
const deleteCategoryBtn = document.getElementById("delete-category-btn");
document.getElementById('enableNotifsBtn')?.addEventListener('click', enableNotifications);


let categories = JSON.parse(localStorage.getItem("todoCategories")) || {};
let currentCategory = null;

// 🎤 Speech input handling
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.onresult = function (event) {
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

// 🌙 Toggle Instructions and Dark Mode
window.addEventListener("DOMContentLoaded", () => {
  helpBtn.addEventListener("click", () => {
    instructions.classList.toggle("hidden");
    helpBtn.textContent = instructions.classList.contains("hidden")
      ? "How to Use"
      : "🔽 Hide Instructions";
  });

  darkToggle?.addEventListener("change", () => {
    document.body.classList.toggle("dark", darkToggle.checked);
  });
});

// ➕ Add task
addBtn.addEventListener("click", addTask);
function addTask() {
  const taskText = input.value.trim();
  if (taskText === "" || !currentCategory) return;

  const task = { text: taskText, completed: false };
  categories[currentCategory].push(task);
  input.value = "";
  saveCategories();
  renderTasks();

  // Request a background sync to persist changes when online
  requestBackgroundSync();
}

// 🗑️ Render task list
function renderTasks() {
  list.innerHTML = "";
  if (!currentCategory || !categories[currentCategory]) return;

  categories[currentCategory].forEach((task, index) => {
    const li = document.createElement("li");
    if (task.completed) li.classList.add("completed");

    li.innerHTML = `
      <span>${task.text}</span>
      <button class="delete-btn">❌</button>
    `;

    li.querySelector("span").addEventListener("click", () => {
      task.completed = !task.completed;
      saveCategories();
      renderTasks();
      requestBackgroundSync();
    });

    li.querySelector("button").addEventListener("click", () => {
      categories[currentCategory].splice(index, 1);
      saveCategories();
      renderTasks();
      requestBackgroundSync();
    });

    list.appendChild(li);
  });
}

// 💾 Save categories
function saveCategories() {
  localStorage.setItem("todoCategories", JSON.stringify(categories));
}

// 🔁 Update dropdown
function updateCategoryDropdown() {
  categorySelect.innerHTML = '<option disabled selected>Select category</option>';
  Object.keys(categories).forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  if (currentCategory && categories[currentCategory]) {
    categorySelect.value = currentCategory;
    deleteCategoryBtn.classList.add("visible");
  } else {
    deleteCategoryBtn.classList.remove("visible");
  }
}

// ➕ Add category button logic
addCategoryBtn.addEventListener("click", () => {
  if (newCategoryInput.classList.contains("hidden")) {
    newCategoryInput.classList.remove("hidden");
    newCategoryInput.focus();
    deleteCategoryBtn.classList.remove("visible");
    return;
  }

  const name = newCategoryInput.value.trim();
  if (!name || categories[name]) return;

  categories[name] = [];
  saveCategories();
  updateCategoryDropdown();
  categorySelect.value = name;
  currentCategory = name;
  newCategoryInput.value = "";
  newCategoryInput.classList.add("hidden");
  deleteCategoryBtn.classList.add("visible");
  renderTasks();
  requestBackgroundSync();
});

// 🔄 Hide category input when dropdown is focused
categorySelect.addEventListener("focus", () => {
  newCategoryInput.classList.add("hidden");
});

// 🔄 Handle dropdown change (select category)
categorySelect.addEventListener("change", () => {
  currentCategory = categorySelect.value;
  renderTasks();
  deleteCategoryBtn.classList.add("visible");
  deleteCategoryBtn.disabled = false; // ✅ This line fixes the issue
});

// ✅ 🗑️ Delete category (fixed)
deleteCategoryBtn.addEventListener("click", () => {
  if (!currentCategory || !categories[currentCategory]) {
    alert("Please select a category to delete.");
    return;
  }

  const confirmDelete = confirm(
    `Are you sure you want to delete "${currentCategory}" and all its tasks?`
  );
  if (!confirmDelete) return;

  delete categories[currentCategory];
  saveCategories();
  currentCategory = null;
  updateCategoryDropdown();
  categorySelect.selectedIndex = 0;
  list.innerHTML = "";
  deleteCategoryBtn.classList.remove("visible");
  deleteCategoryBtn.disabled = true; // ✅ Hide + disable again
  alert("Deleted category successfully.");

  requestBackgroundSync();
});

// ⏰ Live Clock
function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById("liveClock");
  clockEl.textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// ===== PWA: Service Worker registration (register immediately)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js", { scope: "./" })
    .then(async (reg) => {
      console.log("Service Worker registered!", reg);

      // Periodic Background Sync (supported on some Chromium PWAs)
      try {
        if ("periodicSync" in reg) {
          const status = await navigator.permissions.query({ name: "periodic-background-sync" });
          if (status.state === "granted") {
            // Refresh at least every 24 hours
            await reg.periodicSync.register("asset-cache", { minInterval: 24 * 60 * 60 * 1000 });
            console.log("Periodic sync registered.");
          } else {
            console.log("Periodic sync permission not granted.");
          }
        } else {
          console.log("Periodic sync not supported on this browser.");
        }
      } catch (e) {
        console.log("Periodic sync registration error:", e);
      }

      return navigator.serviceWorker.ready;
    })
    .then((readyReg) => {
      console.log("Service Worker ready. Scope:", readyReg.scope);
    })
    .catch((err) => console.error("Service Worker registration failed:", err));
}

// ===== Background Sync: helper to request a one-off sync
async function requestBackgroundSync() {
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register("sync-tasks");
    console.log("Background sync registered.");
  } catch (err) {
    console.warn("Background sync registration failed:", err);
  }
}

// ===== Push Notifications: enable helper (call from a UI button when desired)
async function enableNotifications() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    alert("Notifications not supported in this browser.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("Notifications permission denied or dismissed.");
    return;
  }
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification("Notifications enabled", {
    body: "You will receive alerts from the To-Do app.",
    icon: "icon-192.png",
    badge: "icon-192.png"
  });
  console.log("Local notification shown.");
}

// Expose enableNotifications if you want to hook it from HTML:
// window.enableNotifications = enableNotifications;

console.log("Delete button:", deleteCategoryBtn);
