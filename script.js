document.addEventListener("DOMContentLoaded", () => {
  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  const addTaskBtn = document.getElementById("add-task-btn");
  const categorySelect = document.getElementById("category-select");
  const addCategoryBtn = document.getElementById("add-category-btn");
  const deleteCategoryBtn = document.getElementById("delete-category-btn");
  const newCategoryInput = document.getElementById("new-category-input");
  const clockElement = document.getElementById("clock");
  const micBtn = document.getElementById("mic-btn");
  const toggleDarkMode = document.getElementById("toggle-dark-mode");

  // DARK MODE
  toggleDarkMode.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
  });

  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }

  // CLOCK
  function updateClock() {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString();
  }
  updateClock();
  setInterval(updateClock, 1000);

  // CATEGORY HANDLING
  function saveCategories(categories) {
    localStorage.setItem("categories", JSON.stringify(categories));
  }

  function loadCategories() {
    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    categorySelect.innerHTML = `<option value="">Select Category</option>`;
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
    deleteCategoryBtn.disabled = true;
  }

  function getTasks() {
    return JSON.parse(localStorage.getItem("tasks")) || {};
  }

  function saveTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function loadTasks() {
    const selectedCategory = categorySelect.value;
    const tasks = getTasks();
    taskList.innerHTML = "";
    if (selectedCategory && tasks[selectedCategory]) {
      tasks[selectedCategory].forEach((task, index) => {
        const li = document.createElement("li");
        li.textContent = task;
        taskList.appendChild(li);
      });
    }
  }

  // Add category
  addCategoryBtn.addEventListener("click", () => {
    newCategoryInput.style.display = "inline-block";
    newCategoryInput.focus();
    addCategoryBtn.style.display = "none";
    deleteCategoryBtn.style.display = "none";
  });

  newCategoryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const category = newCategoryInput.value.trim();
      if (category) {
        const categories = JSON.parse(localStorage.getItem("categories")) || [];
        if (!categories.includes(category)) {
          categories.push(category);
          saveCategories(categories);
          loadCategories();
          categorySelect.value = category;
          loadTasks();
        }
        newCategoryInput.value = "";
        newCategoryInput.style.display = "none";
        addCategoryBtn.style.display = "inline-block";
        deleteCategoryBtn.style.display = "inline-block";
      }
    }
  });

  categorySelect.addEventListener("change", () => {
    loadTasks();
    deleteCategoryBtn.disabled = !categorySelect.value;
    newCategoryInput.style.display = "none";
    addCategoryBtn.style.display = "inline-block";
    deleteCategoryBtn.style.display = "inline-block";
  });

  deleteCategoryBtn.addEventListener("click", () => {
    const selected = categorySelect.value;
    if (selected && confirm(`Delete category "${selected}"?`)) {
      const categories = JSON.parse(localStorage.getItem("categories")) || [];
      const updatedCategories = categories.filter((c) => c !== selected);
      saveCategories(updatedCategories);
      const tasks = getTasks();
      delete tasks[selected];
      saveTasks(tasks);
      loadCategories();
      loadTasks();
    }
  });

  // Add task (hybrid: localStorage + Firestore)
  async function addTask() {
    const category = categorySelect.value;
    const task = taskInput.value.trim();
    if (category && task) {
      const tasks = getTasks();
      if (!tasks[category]) tasks[category] = [];
      tasks[category].push(task);
      saveTasks(tasks);
      loadTasks();

      // Firestore save
      if (window.addTaskToFirebase) {
        await window.addTaskToFirebase(category, task);
      }

      taskInput.value = "";
    }
  }

  addTaskBtn.addEventListener("click", addTask);

  taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });

  // Voice to text
  if ("webkitSpeechRecognition" in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    micBtn.addEventListener("click", () => {
      recognition.start();
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      taskInput.value = transcript;
      recognition.stop();
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event);
    };
  } else {
    micBtn.style.display = "none";
  }

  // Load categories/tasks on init
  loadCategories();
  loadTasks();
});
