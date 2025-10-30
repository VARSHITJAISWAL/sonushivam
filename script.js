
/* ----------------- LOGIN & REGISTER LOGIC ------------------- */
const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const authTitle = document.getElementById("authTitle");
const authActionBtn = document.getElementById("authActionBtn");
const switchText = document.getElementById("switchText");
const switchLink = document.getElementById("switchLink");
const emailInput = document.getElementById("authEmail");
const passInput = document.getElementById("authPassword");
const logoutBtn = document.getElementById("logoutBtn");
const usernameDisplay = document.getElementById("usernameDisplay");

let isLoginMode = true;

function loadUsers() {
  return JSON.parse(localStorage.getItem("users")) || {};
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

switchLink.onclick = () => {
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? "🔐 Login" : "📝 Register";
  authActionBtn.textContent = isLoginMode ? "Login" : "Register";
  switchText.innerHTML = isLoginMode
    ? `Don’t have an account? <span class="switch-link" id="switchLink">Register</span>`
    : `Already have an account? <span class="switch-link" id="switchLink">Login</span>`;
  document.querySelector("#switchLink").onclick = switchLink.onclick;
};

authActionBtn.onclick = () => {
  const email = emailInput.value.trim();
  const password = passInput.value.trim();
  if (!email || !password) return alert("Please fill all fields.");

  let users = loadUsers();

  if (isLoginMode) {
    if (!users[email]) return alert("User not found! Please register.");
    if (users[email].password !== password) return alert("Incorrect password!");
    localStorage.setItem("loggedInUser", email);
    showDashboard(email);
  } else {
    if (users[email]) return alert("User already exists! Please login.");
    users[email] = { password };
    saveUsers(users);
    alert("Registration successful! Please login now.");
    switchLink.onclick();
  }
};

function showDashboard(email) {
  authSection.style.display = "none";
  dashboardSection.style.display = "block";
  usernameDisplay.textContent = email;
  updateUI();
}

logoutBtn.onclick = () => {
  localStorage.removeItem("loggedInUser");
  location.reload();
};

const loggedUser = localStorage.getItem("loggedInUser");
if (loggedUser) showDashboard(loggedUser);

/* ----------------- DASHBOARD LOGIC ------------------- */
const categories = [
  { key: "room", label: "🏠 Room Rent" },
  { key: "maintenance", label: "🧾 Maintenance Bill" },
  { key: "electricity", label: "⚡ Electricity Bill" },
  { key: "groceries", label: "🛒 Groceries" },
  { key: "travel", label: "🚗 Travel" },
  { key: "food", label: "🍽 Food" },
  { key: "other", label: "💼 Other" },
];

const monthSelector = document.getElementById("monthSelector");
const yearSelector = document.getElementById("yearSelector");
const totalBudgetInput = document.getElementById("totalBudgetInput");
const setBudgetBtn = document.getElementById("setBudgetBtn");
const totalBudget = document.getElementById("totalBudget");
const balance = document.getElementById("balance");
const remaining = document.getElementById("remaining");
const percentUsed = document.getElementById("percentUsed");
const topCategory = document.getElementById("topCategory");
const categoryGrid = document.getElementById("categoryGrid");

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

monthNames.forEach((m, i) => {
  const opt = document.createElement("option");
  opt.value = String(i + 1).padStart(2, "0");
  opt.textContent = m;
  monthSelector.appendChild(opt);
});

for (let y = 2024; y <= 2100; y++) {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  yearSelector.appendChild(opt);
}

monthSelector.value = new Date().getMonth() + 1;
yearSelector.value = new Date().getFullYear();

function getUserData() {
  const email = localStorage.getItem("loggedInUser");
  let allData = JSON.parse(localStorage.getItem("budgetData")) || {};
  if (!allData[email]) allData[email] = {};
  return allData;
}

function saveUserData(allData) {
  localStorage.setItem("budgetData", JSON.stringify(allData));
}

function getKey() {
  return `${yearSelector.value}-${String(monthSelector.value).padStart(2, "0")}`;
}

function getMonthData() {
  const email = localStorage.getItem("loggedInUser");
  const allData = getUserData();
  const key = getKey();
  if (!allData[email][key]) {
    allData[email][key] = { budgetLimit: 0, expenses: {}, dates: {} };
    categories.forEach((c) => (allData[email][key].expenses[c.key] = 0));
  }
  saveUserData(allData);
  return allData[email][key];
}

function renderCategories() {
  categoryGrid.innerHTML = "";
  categories.forEach((c) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <button class="delete-btn" onclick="deleteExpense('${c.key}')">✖</button>
      <h3>${c.label}</h3>
      <input type="number" id="${c.key}Input" placeholder="Enter amount" />
      <button onclick="addExpense('${c.key}')">Add/Update</button>
      <p>Total: <span id="${c.key}Total">₹0</span></p>
      <p id="${c.key}Date">—</p>`;
    categoryGrid.appendChild(div);
  });
}
renderCategories();

function updateUI() {
  if (!localStorage.getItem("loggedInUser")) return;
  const data = getMonthData();
  totalBudget.textContent = `₹${data.budgetLimit.toFixed(2)}`;
  let totalSpent = 0, highest = { cat: "None", val: 0 };
  categories.forEach((c) => {
    totalSpent += data.expenses[c.key];
    if (data.expenses[c.key] > highest.val) highest = { cat: c.label, val: data.expenses[c.key] };
    document.getElementById(`${c.key}Total`).textContent = `₹${data.expenses[c.key].toFixed(2)}`;
    document.getElementById(`${c.key}Date`).textContent = data.dates[c.key] || "—";
  });
  balance.textContent = `₹${totalSpent.toFixed(2)}`;
  remaining.textContent = `₹${(data.budgetLimit - totalSpent).toFixed(2)}`;
  percentUsed.textContent = data.budgetLimit
    ? ((totalSpent / data.budgetLimit) * 100).toFixed(1) + "%"
    : "0%";
  topCategory.textContent = highest.cat;
  updateCharts(data);
}

setBudgetBtn.onclick = () => {
  const val = parseFloat(totalBudgetInput.value);
  if (!val || val <= 0) return alert("Enter a valid total budget!");
  const data = getMonthData();
  data.budgetLimit = val;
  const allData = getUserData();
  allData[localStorage.getItem("loggedInUser")][getKey()] = data;
  saveUserData(allData);
  updateUI();
};

window.addExpense = function (category) {
  const input = document.getElementById(`${category}Input`);
  const val = parseFloat(input.value);
  if (!val || val < 0) return alert("Enter a valid amount!");
  const data = getMonthData();
  data.expenses[category] = val;
  data.dates[category] = new Date().toLocaleString();
  const allData = getUserData();
  allData[localStorage.getItem("loggedInUser")][getKey()] = data;
  saveUserData(allData);
  input.value = "";
  updateUI();
};

window.deleteExpense = function (category) {
  const data = getMonthData();
  data.expenses[category] = 0;
  data.dates[category] = "—";
  const allData = getUserData();
  allData[localStorage.getItem("loggedInUser")][getKey()] = data;
  saveUserData(allData);
  updateUI();
};

monthSelector.onchange = updateUI;
yearSelector.onchange = updateUI;

let expenseChart;
function updateCharts(data) {
  const expenseValues = categories.map((c) => data.expenses[c.key]);
  const labels = categories.map((c) => c.label);

  if (expenseChart) expenseChart.destroy();
  const expCtx = document.getElementById("expenseChart").getContext("2d");
  expenseChart = new Chart(expCtx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: expenseValues,
        backgroundColor: ["#36a2eb", "#ff6384", "#ffcd56", "#4bc0c0", "#9966ff", "#ff9f40", "#8bc34a"],
      }],
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        datalabels: {
          color: "#000",
          formatter: (v, ctx) => {
            const sum = ctx.chart._metasets[0].total;
            return ((v / sum) * 100).toFixed(1) + "%";
          },
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

updateUI();
