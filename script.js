
// DOM Elements
const input = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const taskList = document.getElementById("task-list");
const categorySelect = document.getElementById("category-select");
const addCategoryBtn = document.getElementById("add-category-btn");
const categoryInputContainer = document.getElementById("category-input-container");
const newCategoryInput = document.getElementById("new-category");
const deleteCategoryBtn = document.getElementById("delete-category-btn");

let currentCategory = null;
let categories = {};

// Load from localStorage
function loadCategories() {
  const stored = localStorage.getItem("categories");
  if (stored) {
    categories = JSON.parse(stored);
  }
}

// Save to localStorage
function saveCategories() {
  localStorage.setItem("categories", JSON.stringify(categories));
}

// Render category options
function renderCategories() {
  categorySelect.innerHTML = "";
  Object.keys(categories).forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
  if (currentCategory && categories[currentCategory]) {
    categorySelect.value = currentCategory;
  }
  deleteCategoryBtn.disabled = !currentCategory;
}

// Render tasks
function renderTasks() {
  if (!currentCategory) return;
  taskList.innerHTML = "";
  const tasks = categories[currentCategory] || [];
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.textContent = task.text;
    li.className = task.completed ? "completed" : "";
    li.addEventListener("click", () => toggleComplete(index));
    taskList.appendChild(li);
  });
}

// Toggle task completion
function toggleComplete(index) {
  categories[currentCategory][index].completed = !categories[currentCategory][index].completed;
  saveCategories();
  renderTasks();
}

// Add task (hybrid: localStorage + Firestore)
async function addTask() {
  const taskText = input.value.trim();
  if (!taskText || !currentCategory) return;

  const task = { text: taskText, completed: false };
  categories[currentCategory].push(task);
  saveCategories();

  if (navigator.onLine && window.firebaseDB) {
    const db = window.firebaseDB;
    await addDoc(collection(db, "tasks"), {
      category: currentCategory,
      task: taskText,
      completed: false,
      timestamp: new Date()
    });
  }

  input.value = "";
  renderTasks();
}

// Load tasks from Firestore
async function loadTasks(category) {
  if (!category || !navigator.onLine || !window.firebaseDB) return;
  const db = window.firebaseDB;
  const snapshot = await getDocs(collection(db, "tasks"));
  const remoteTasks = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.category === category) {
      remoteTasks.push({ text: data.task, completed: data.completed });
    }
  });
  categories[category] = remoteTasks;
  saveCategories();
  renderTasks();
}

// Delete selected category (from both storage)
async function deleteCurrentCategory() {
  if (!currentCategory) return;

  // Remove from Firestore
  if (navigator.onLine && window.firebaseDB) {
    const db = window.firebaseDB;
    const snapshot = await getDocs(collection(db, "tasks"));
    snapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      if (data.category === currentCategory) {
        await deleteDoc(doc(db, "tasks", docSnap.id));
      }
    });
  }

  delete categories[currentCategory];
  saveCategories();
  currentCategory = null;
  renderCategories();
  taskList.innerHTML = "";
}

// Event Listeners
addBtn.addEventListener("click", addTask);
categorySelect.addEventListener("change", () => {
  currentCategory = categorySelect.value;
  deleteCategoryBtn.disabled = false;
  loadTasks(currentCategory);
});
addCategoryBtn.addEventListener("click", () => {
  categoryInputContainer.style.display = "block";
  deleteCategoryBtn.style.display = "none";
});
newCategoryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const newCat = newCategoryInput.value.trim();
    if (newCat && !categories[newCat]) {
      categories[newCat] = [];
      currentCategory = newCat;
      saveCategories();
      renderCategories();
      renderTasks();
    }
    newCategoryInput.value = "";
    categoryInputContainer.style.display = "none";
    deleteCategoryBtn.style.display = "inline-block";
  }
});
deleteCategoryBtn.addEventListener("click", deleteCurrentCategory);

// Initialize
loadCategories();
renderCategories();
if (categorySelect.value) {
  currentCategory = categorySelect.value;
  loadTasks(currentCategory);
}
renderTasks();
