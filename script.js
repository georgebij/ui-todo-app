document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const taskInput = document.getElementById("task-input");
  const addTaskBtn = document.getElementById("add-task-btn");
  const taskList = document.getElementById("task-list");
  const categorySelect = document.getElementById("category-select");
  const addCategoryBtn = document.getElementById("add-category-btn");
  const categoryInputContainer = document.getElementById("category-input-container");
  const newCategoryInput = document.getElementById("new-category");
  const deleteCategoryBtn = document.getElementById("delete-category-btn");
  const toggleModeBtn = document.getElementById("toggle-mode");

  // Load from localStorage
  function getStoredTasks() {
    return JSON.parse(localStorage.getItem("tasks")) || [];
  }

  function saveTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function getCategories() {
    return JSON.parse(localStorage.getItem("categories")) || [];
  }

  function saveCategories(categories) {
    localStorage.setItem("categories", JSON.stringify(categories));
  }

  // Display Tasks
  function loadTasks() {
    const selectedCategory = categorySelect.value;
    const tasks = getStoredTasks().filter(task => task.category === selectedCategory);
    taskList.innerHTML = "";
    tasks.forEach(task => {
      const li = document.createElement("li");
      li.textContent = task.name;
      taskList.appendChild(li);
    });
  }

  // Add Task (localStorage + Firebase)
  async function addTask() {
    const name = taskInput.value.trim();
    const category = categorySelect.value;
    if (!name || !category) return;

    const task = { name, category, createdAt: new Date().toISOString() };
    const tasks = getStoredTasks();
    tasks.push(task);
    saveTasks(tasks);
    loadTasks();

    if (window.addTaskToFirebase) {
      await window.addTaskToFirebase(task);
    }

    taskInput.value = "";
  }

  // Populate dropdown
  function populateCategorySelect() {
    const categories = getCategories();
    categorySelect.innerHTML = "<option value=''>--Select--</option>";
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  }

  // Add category
  function addCategory() {
    const newCat = newCategoryInput.value.trim();
    if (!newCat) return;

    const categories = getCategories();
    if (!categories.includes(newCat)) {
      categories.push(newCat);
      saveCategories(categories);
    }
    newCategoryInput.value = "";
    categoryInputContainer.style.display = "none";
    populateCategorySelect();
  }

  // Delete category
  function deleteCategory() {
    const selectedCategory = categorySelect.value;
    if (!selectedCategory) return;

    const categories = getCategories().filter(c => c !== selectedCategory);
    saveCategories(categories);

    const updatedTasks = getStoredTasks().filter(task => task.category !== selectedCategory);
    saveTasks(updatedTasks);

    populateCategorySelect();
    loadTasks();
    deleteCategoryBtn.disabled = true;
  }

  // Toggle dark/light mode
  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
  }

  // Live clock
  function updateClock() {
    const clock = document.getElementById("clock");
    if (clock) {
      const now = new Date();
      clock.textContent = now.toLocaleTimeString();
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Event Listeners
  addTaskBtn.addEventListener("click", addTask);
  addCategoryBtn.addEventListener("click", () => {
    categoryInputContainer.style.display = "block";
    deleteCategoryBtn.style.display = "none";
  });
  newCategoryInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addCategory();
  });
  categorySelect.addEventListener("change", () => {
    loadTasks();
    deleteCategoryBtn.style.display = categorySelect.value ? "inline-block" : "none";
  });
  deleteCategoryBtn.addEventListener("click", deleteCategory);
  toggleModeBtn.addEventListener("click", toggleDarkMode);

  // Initial load
  populateCategorySelect();
  loadTasks();

  // Service Worker Registration
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/ui-todo-app/service-worker.js")
        .then(reg => console.log("Service Worker registered!", reg))
        .catch(err => console.error("Service Worker registration failed:", err));
    });
  }
});
