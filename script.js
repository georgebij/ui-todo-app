document.addEventListener("DOMContentLoaded", function () {
  // Firebase: global app variable
  let db;
  import("https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js").then(({ initializeApp }) => {
    import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js").then(({ getFirestore, collection, addDoc, getDocs, doc, deleteDoc, setDoc }) => {
      const firebaseConfig = {
        apiKey: "AIzaSyBXXNTzZo-lbED9MZQIotO3fujYIapafr4",
        authDomain: "ui-todo-app-9a3b5.firebaseapp.com",
        projectId: "ui-todo-app-9a3b5",
        storageBucket: "ui-todo-app-9a3b5.firebasestorage.app",
        messagingSenderId: "333238646450",
        appId: "1:333238646450:web:823051916561913a353bab"
      };
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    });
  });

  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  const addTaskBtn = document.getElementById("add-task-btn");
  const categorySelect = document.getElementById("category-select");
  const addCategoryBtn = document.getElementById("add-category-btn");
  const newCategoryInput = document.getElementById("new-category-input");
  const deleteCategoryBtn = document.getElementById("delete-category-btn");

  const clockElement = document.getElementById("clock");
  const toggleModeBtn = document.getElementById("toggle-mode");

  // Dark Mode
  toggleModeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });

  // Clock
  function updateClock() {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString();
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Initialize categories
  function loadCategories() {
    const categories = JSON.parse(localStorage.getItem("categories")) || [];
    categorySelect.innerHTML = "";
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
    if (categories.length > 0) {
      deleteCategoryBtn.disabled = false;
    } else {
      deleteCategoryBtn.disabled = true;
    }
  }

  function saveCategories(categories) {
    localStorage.setItem("categories", JSON.stringify(categories));
  }

  addCategoryBtn.addEventListener("click", () => {
    newCategoryInput.style.display = "inline-block";
    newCategoryInput.focus();
    deleteCategoryBtn.style.display = "none";
  });

  newCategoryInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && newCategoryInput.value.trim() !== "") {
      const newCategory = newCategoryInput.value.trim();
      let categories = JSON.parse(localStorage.getItem("categories")) || [];
      if (!categories.includes(newCategory)) {
        categories.push(newCategory);
        saveCategories(categories);
        loadCategories();
        categorySelect.value = newCategory;
      }
      newCategoryInput.value = "";
      newCategoryInput.style.display = "none";
      deleteCategoryBtn.style.display = "inline-block";
    }
  });

  categorySelect.addEventListener("focus", () => {
    newCategoryInput.style.display = "none";
    if (categorySelect.value) {
      deleteCategoryBtn.style.display = "inline-block";
    }
  });

  deleteCategoryBtn.addEventListener("click", () => {
    const selected = categorySelect.value;
    if (!selected) return;
    if (confirm(`Delete category '${selected}'? This will remove its tasks.`)) {
      let categories = JSON.parse(localStorage.getItem("categories")) || [];
      categories = categories.filter((cat) => cat !== selected);
      saveCategories(categories);
      localStorage.removeItem(`tasks-${selected}`);
      loadCategories();
      taskList.innerHTML = "";
    }
  });

  // Tasks
  function saveTasks(category, tasks) {
    localStorage.setItem(`tasks-${category}`, JSON.stringify(tasks));
  }

  function loadTasks() {
    const category = categorySelect.value;
    if (!category) return;
    const tasks = JSON.parse(localStorage.getItem(`tasks-${category}`)) || [];
    taskList.innerHTML = "";
    tasks.forEach((task, index) => {
      const li = document.createElement("li");
      li.textContent = task;
      const del = document.createElement("button");
      del.textContent = "❌";
      del.addEventListener("click", () => {
        tasks.splice(index, 1);
        saveTasks(category, tasks);
        loadTasks();
      });
      li.appendChild(del);
      taskList.appendChild(li);
    });
  }

  addTaskBtn.addEventListener("click", async () => {
    const task = taskInput.value.trim();
    const category = categorySelect.value;
    if (!task || !category) return;
    const tasks = JSON.parse(localStorage.getItem(`tasks-${category}`)) || [];
    tasks.push(task);
    saveTasks(category, tasks);
    taskInput.value = "";
    loadTasks();

    // Firestore hybrid save
    if (typeof addDoc === "function") {
      try {
        const docRef = await addDoc(collection(db, "tasks"), {
          task,
          category,
          timestamp: new Date()
        });
        console.log("Saved to Firestore:", docRef.id);
      } catch (e) {
        console.error("Error saving to Firestore", e);
      }
    }
  });

  categorySelect.addEventListener("change", loadTasks);

  // Initialize
  loadCategories();
  if (categorySelect.value) loadTasks();

  // Service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("service-worker.js")
        .then((reg) => console.log("SW registered", reg))
        .catch((err) => console.error("SW registration failed", err));
    });
  }
});
