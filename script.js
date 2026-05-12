const STORAGE_KEYS = {
  transactions: "financeTracker.transactions",
  income: "financeTracker.income",
  budgets: "financeTracker.budgets",
  savings: "financeTracker.savings",
  theme: "financeTracker.theme"
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const defaultCategories = [
  "Food",
  "Groceries",
  "Rent",
  "Transportation",
  "Gas",
  "Entertainment",
  "Subscriptions",
  "School",
  "Giving/Donations",
  "Shopping",
  "Health",
  "Other"
];

const incomeCategories = [
  "BYU Online",
  "Side Hustle",
  "Gifts",
  "Other"
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

let transactions = loadFromStorage(STORAGE_KEYS.transactions, []);
let incomeEntries = loadFromStorage(STORAGE_KEYS.income, []);
let budgets = loadFromStorage(STORAGE_KEYS.budgets, {});
let savingsPlan = loadFromStorage(STORAGE_KEYS.savings, null);
let currentPeriod = "weekly";

const today = new Date();

document.addEventListener("DOMContentLoaded", () => {
  setupTheme();
  setupMonthDropdowns();
  setupDefaultDates();
  setupSavedSavingsPlan();
  setupTabs();
  setupPeriodToggle();
  setupSettings();
  setupForms();
  setupFilters();
  setupTableActions();
  setupBudgetActions();
  setupIncomeActions();
  renderApp();
});

function loadFromStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function setupTheme() {
  if (localStorage.getItem(STORAGE_KEYS.theme) === "dark") {
    document.body.classList.add("dark");
  }
}

function setupMonthDropdowns() {
  const monthSelects = [
    document.getElementById("month"),
    document.getElementById("incomeMonth"),
    document.getElementById("filterMonth")
  ];

  monthSelects.forEach(select => {
    select.innerHTML = monthNames
      .map((name, index) => `<option value="${index}">${name}</option>`)
      .join("");
  });
}

function setupDefaultDates() {
  document.getElementById("day").value = today.getDate();
  document.getElementById("month").value = today.getMonth();
  document.getElementById("year").value = today.getFullYear();

  document.getElementById("incomeDay").value = today.getDate();
  document.getElementById("incomeMonth").value = today.getMonth();
  document.getElementById("incomeYear").value = today.getFullYear();

  document.getElementById("filterMonth").value = today.getMonth();
  document.getElementById("filterYear").value = today.getFullYear();
}

function setupSavedSavingsPlan() {
  if (!savingsPlan) return;

  document.getElementById("savingsGoal").value = savingsPlan.goal;
  document.getElementById("timeFrame").value = savingsPlan.months;
}

function setupTabs() {
  document.querySelectorAll(".nav-button").forEach(button => {
    button.addEventListener("click", () => {
      switchTab(button.dataset.tab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-section").forEach(section => {
    section.classList.toggle("active", section.id === tabId);
  });
}

function setupPeriodToggle() {
  document.querySelectorAll(".period-button").forEach(button => {
    button.addEventListener("click", () => {
      currentPeriod = button.dataset.period;

      document.querySelectorAll(".period-button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.period === currentPeriod);
      });

      document.getElementById("periodLabel").value =
        currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1);

      renderApp();
    });
  });
}

function setupSettings() {
  const settingsButton = document.getElementById("settingsButton");
  const settingsMenu = document.getElementById("settingsMenu");

  settingsButton.addEventListener("click", () => {
    settingsMenu.classList.toggle("hidden");
  });

  document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    localStorage.setItem(
      STORAGE_KEYS.theme,
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  });

  document.getElementById("exportCsvButton").addEventListener("click", exportCsv);

  document.getElementById("importCsvButton").addEventListener("click", () => {
    document.getElementById("csvFileInput").click();
  });

  document.getElementById("csvFileInput").addEventListener("change", importCsv);
}

function setupForms() {
  document.getElementById("transactionForm").addEventListener("submit", saveTransaction);
  document.getElementById("incomeForm").addEventListener("submit", saveIncome);
  document.getElementById("budgetForm").addEventListener("submit", saveBudget);
  document.getElementById("savingsForm").addEventListener("submit", saveSavingsPlan);

  document.getElementById("cancelEditButton").addEventListener("click", resetTransactionForm);

  document.getElementById("clearAllButton").addEventListener("click", () => {
    if (!confirm("Are you sure you want to delete all spending transactions?")) return;

    transactions = [];
    saveToStorage(STORAGE_KEYS.transactions, transactions);
    renderApp();
  });
}

function setupFilters() {
  document.getElementById("filterMonth").addEventListener("change", renderApp);
  document.getElementById("filterYear").addEventListener("input", renderApp);
  document.getElementById("searchInput").addEventListener("input", renderTransactions);
  document.getElementById("categoryFilter").addEventListener("change", renderTransactions);

  document.getElementById("clearFiltersButton").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("categoryFilter").value = "";
    renderTransactions();
  });
}

function setupTableActions() {
  document.getElementById("transactionTable").addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;

    const id = button.dataset.id;

    if (button.dataset.action === "edit") {
      editTransaction(id);
    }

    if (button.dataset.action === "delete") {
      deleteTransaction(id);
    }
  });
}

function setupBudgetActions() {
  document.getElementById("budgetList").addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.action === "delete-budget") {
      deleteBudget(button.dataset.category);
    }
  });
}

function setupIncomeActions() {
  document.getElementById("incomeTable").addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.action === "delete-income") {
      deleteIncome(button.dataset.id);
    }
  });
}

function saveTransaction(event) {
  event.preventDefault();

  const editingId = document.getElementById("editingTransactionId").value;
  const day = Number(document.getElementById("day").value);
  const month = Number(document.getElementById("month").value);
  const year = Number(document.getElementById("year").value);
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value.trim();
  const merchant = document.getElementById("merchant").value.trim();
  const notes = document.getElementById("notes").value.trim();

  const date = new Date(year, month, day);

  if (Number.isNaN(date.getTime()) || date.getDate() !== day) {
    alert("Please enter a valid date.");
    return;
  }

  if (!amount || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  if (!category) {
    alert("Please enter a category.");
    return;
  }

  const transaction = {
    id: editingId || createId(),
    date: date.toISOString(),
    amount,
    category,
    merchant,
    notes
  };

  if (editingId) {
    transactions = transactions.map(item => item.id === editingId ? transaction : item);
  } else {
    transactions.push(transaction);
  }

  saveToStorage(STORAGE_KEYS.transactions, transactions);
  resetTransactionForm();
  renderApp();
}

function saveIncome(event) {
  event.preventDefault();

  const day = Number(document.getElementById("incomeDay").value);
  const month = Number(document.getElementById("incomeMonth").value);
  const year = Number(document.getElementById("incomeYear").value);
  const amount = Number(document.getElementById("incomeAmount").value);
  const category = document.getElementById("incomeCategory").value;
  const notes = document.getElementById("incomeNotes").value.trim();

  const date = new Date(year, month, day);

  if (Number.isNaN(date.getTime()) || date.getDate() !== day) {
    alert("Please enter a valid income date.");
    return;
  }

  if (!amount || amount <= 0 || !category) {
    alert("Please enter a valid income amount and category.");
    return;
  }

  incomeEntries.push({
    id: createId(),
    date: date.toISOString(),
    amount,
    category,
    notes
  });

  saveToStorage(STORAGE_KEYS.income, incomeEntries);

  document.getElementById("incomeForm").reset();
  document.getElementById("incomeDay").value = today.getDate();
  document.getElementById("incomeMonth").value = today.getMonth();
  document.getElementById("incomeYear").value = today.getFullYear();

  renderApp();
}

function deleteIncome(id) {
  if (!confirm("Delete this income entry?")) return;

  incomeEntries = incomeEntries.filter(item => item.id !== id);
  saveToStorage(STORAGE_KEYS.income, incomeEntries);
  renderApp();
}

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return String(Date.now() + Math.random());
}

function resetTransactionForm() {
  document.getElementById("editingTransactionId").value = "";
  document.getElementById("transactionFormTitle").textContent = "Add Spending";
  document.getElementById("cancelEditButton").classList.add("hidden");

  document.getElementById("transactionForm").reset();

  document.getElementById("day").value = today.getDate();
  document.getElementById("month").value = today.getMonth();
  document.getElementById("year").value = today.getFullYear();
}

function editTransaction(id) {
  const transaction = transactions.find(item => item.id === id);
  if (!transaction) return;

  const date = new Date(transaction.date);

  document.getElementById("editingTransactionId").value = transaction.id;
  document.getElementById("day").value = date.getDate();
  document.getElementById("month").value = date.getMonth();
  document.getElementById("year").value = date.getFullYear();
  document.getElementById("amount").value = transaction.amount;
  document.getElementById("category").value = transaction.category;
  document.getElementById("merchant").value = transaction.merchant || "";
  document.getElementById("notes").value = transaction.notes || "";

  document.getElementById("transactionFormTitle").textContent = "Edit Spending";
  document.getElementById("cancelEditButton").classList.remove("hidden");

  switchTab("transactions");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteTransaction(id) {
  if (!confirm("Delete this spending transaction?")) return;

  transactions = transactions.filter(item => item.id !== id);
  saveToStorage(STORAGE_KEYS.transactions, transactions);
  renderApp();
}

function saveBudget(event) {
  event.preventDefault();

  const category = document.getElementById("budgetCategory").value.trim();
  const amount = Number(document.getElementById("budgetAmount").value);

  if (!category || amount <= 0) {
    alert("Please enter a valid category and budget amount.");
    return;
  }

  budgets[category] = amount;
  saveToStorage(STORAGE_KEYS.budgets, budgets);

  document.getElementById("budgetForm").reset();
  renderApp();
}

function deleteBudget(category) {
  if (!confirm(`Delete the budget for ${category}?`)) return;

  delete budgets[category];
  saveToStorage(STORAGE_KEYS.budgets, budgets);
  renderApp();
}

function saveSavingsPlan(event) {
  event.preventDefault();

  const goal = Number(document.getElementById("savingsGoal").value);
  const months = Number(document.getElementById("timeFrame").value);

  if (goal <= 0 || months <= 0) {
    alert("Please enter valid savings plan numbers.");
    return;
  }

  savingsPlan = { goal, months };
  saveToStorage(STORAGE_KEYS.savings, savingsPlan);
  renderApp();
}

function getSelectedMonth() {
  return Number(document.getElementById("filterMonth").value);
}

function getSelectedYear() {
  return Number(document.getElementById("filterYear").value);
}

function getPeriodDateRange(period) {
  const selectedMonth = getSelectedMonth();
  const selectedYear = getSelectedYear();

  if (period === "weekly") {
    const now = new Date();
    const start = new Date(now);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return { start, end };
  }

  if (period === "monthly") {
    return {
      start: new Date(selectedYear, selectedMonth, 1),
      end: new Date(selectedYear, selectedMonth + 1, 1)
    };
  }

  return {
    start: new Date(selectedYear, 0, 1),
    end: new Date(selectedYear + 1, 0, 1)
  };
}

function filterByRange(list, range) {
  return list.filter(item => {
    const date = new Date(item.date);
    return date >= range.start && date < range.end;
  });
}

function getPeriodTransactions() {
  return filterByRange(transactions, getPeriodDateRange(currentPeriod));
}

function getPeriodIncome() {
  return filterByRange(incomeEntries, getPeriodDateRange(currentPeriod));
}

function getSelectedMonthTransactions() {
  return transactions.filter(transaction => {
    const date = new Date(transaction.date);
    return date.getMonth() === getSelectedMonth() && date.getFullYear() === getSelectedYear();
  });
}

function getSelectedMonthIncome() {
  return incomeEntries.filter(entry => {
    const date = new Date(entry.date);
    return date.getMonth() === getSelectedMonth() && date.getFullYear() === getSelectedYear();
  });
}

function sumEntries(list) {
  return list.reduce((sum, item) => sum + Number(item.amount), 0);
}

function categoryTotals(list) {
  return list.reduce((totals, item) => {
    totals[item.category] = (totals[item.category] || 0) + Number(item.amount);
    return totals;
  }, {});
}

function highestCategory(list) {
  const entries = Object.entries(categoryTotals(list)).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;

  return {
    category: entries[0][0],
    amount: entries[0][1]
  };
}

function renderApp() {
  renderCategoryOptions();
  renderCategoryFilter();
  renderDashboard();
  renderCategoryLists();
  renderTransactions();
  renderIncome();
  renderBudgets();
  renderSavings();
  renderCompare();
}

function renderDashboard() {
  const periodTransactions = getPeriodTransactions();
  const periodIncome = getPeriodIncome();

  const spending = sumEntries(periodTransactions);
  const income = sumEntries(periodIncome);
  const net = income - spending;
  const overall = sumEntries(transactions);

  const periodName = currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1);

  document.getElementById("spendingSummaryLabel").textContent = `${periodName} Spending`;
  document.getElementById("incomeSummaryLabel").textContent = `${periodName} Income`;

  document.getElementById("periodSpendingTotal").textContent = currency.format(spending);
  document.getElementById("periodIncomeTotal").textContent = currency.format(income);
  document.getElementById("periodNetTotal").textContent = currency.format(net);
  document.getElementById("periodNetTotal").className = net >= 0 ? "positive" : "negative";
  document.getElementById("overallTotal").textContent = currency.format(overall);

  renderDashboardInsight(periodTransactions, periodIncome);
  renderBarChart("periodCategoryChart", categoryTotals(periodTransactions));
  renderIncomeCategories("periodIncomeCategories", periodIncome);
}

function renderDashboardInsight(periodTransactions, periodIncome) {
  const box = document.getElementById("dashboardInsight");

  if (!transactions.length && !incomeEntries.length) {
    box.textContent = "Add spending and income entries to see insights.";
    return;
  }

  const spending = sumEntries(periodTransactions);
  const income = sumEntries(periodIncome);
  const net = income - spending;
  const highSpending = highestCategory(periodTransactions);
  const periodName = currentPeriod;

  let message = `For the selected ${periodName} view, you earned ${currency.format(income)} and spent ${currency.format(spending)}. `;

  if (net >= 0) {
    message += `You are ahead by ${currency.format(net)}. `;
  } else {
    message += `You spent ${currency.format(Math.abs(net))} more than you earned. `;
  }

  if (highSpending) {
    message += `Your highest spending category is ${highSpending.category} at ${currency.format(highSpending.amount)}.`;
  }

  box.textContent = message;
}

function renderCategoryLists() {
  renderCategoryList("overallCategories", transactions);
}

function renderCategoryOptions() {
  const categories = getAllCategories();

  document.getElementById("categoryOptions").innerHTML = categories
    .map(category => `<option value="${escapeHtml(category)}"></option>`)
    .join("");
}

function renderCategoryFilter() {
  const categoryFilter = document.getElementById("categoryFilter");
  const selectedValue = categoryFilter.value;
  const categories = getAllCategories();

  categoryFilter.innerHTML = `
    <option value="">All Categories</option>
    ${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}
  `;

  categoryFilter.value = selectedValue;
}

function getAllCategories() {
  const transactionCategories = transactions.map(item => item.category);
  const budgetCategories = Object.keys(budgets);

  return [...new Set([...defaultCategories, ...transactionCategories, ...budgetCategories])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function renderCategoryList(elementId, list) {
  const container = document.getElementById(elementId);
  if (!container) return;

  const entries = Object.entries(categoryTotals(list)).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    container.innerHTML = `<div class="empty-state">No spending yet.</div>`;
    return;
  }

  container.innerHTML = entries.map(([category, amount]) => `
    <div class="list-item">
      <div class="list-row">
        <strong>${escapeHtml(category)}</strong>
        <span>${currency.format(amount)}</span>
      </div>
    </div>
  `).join("");
}

function renderBarChart(elementId, totals) {
  const container = document.getElementById(elementId);
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    container.innerHTML = `<div class="empty-state">No data for this view.</div>`;
    return;
  }

  const maxAmount = Math.max(...entries.map(entry => entry[1]));

  container.innerHTML = entries.map(([category, amount]) => {
    const percent = maxAmount ? (amount / maxAmount) * 100 : 0;

    return `
      <div class="chart-item">
        <div class="chart-label">
          <span>${escapeHtml(category)}</span>
          <strong>${currency.format(amount)}</strong>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderIncomeCategories(elementId, list) {
  const container = document.getElementById(elementId);
  const entries = Object.entries(categoryTotals(list)).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    container.innerHTML = `<div class="empty-state">No income for this view.</div>`;
    return;
  }

  container.innerHTML = entries.map(([category, amount]) => `
    <div class="list-item">
      <div class="list-row">
        <strong>${escapeHtml(category)}</strong>
        <span>${currency.format(amount)}</span>
      </div>
    </div>
  `).join("");
}

function renderTransactions() {
  const table = document.getElementById("transactionTable");
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const categoryFilter = document.getElementById("categoryFilter").value;

  let filtered = [...transactions];

  if (search) {
    filtered = filtered.filter(transaction => {
      return [
        transaction.category,
        transaction.merchant,
        transaction.notes
      ].some(value => String(value || "").toLowerCase().includes(search));
    });
  }

  if (categoryFilter) {
    filtered = filtered.filter(transaction => transaction.category === categoryFilter);
  }

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!filtered.length) {
    table.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">No spending entries match your current view.</div>
        </td>
      </tr>
    `;
    return;
  }

  table.innerHTML = filtered.map(transaction => {
    const date = new Date(transaction.date);
    const dateLabel = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

    return `
      <tr>
        <td>${dateLabel}</td>
        <td>${escapeHtml(transaction.category)}</td>
        <td>${escapeHtml(transaction.merchant || "")}</td>
        <td>${escapeHtml(transaction.notes || "")}</td>
        <td class="right">${currency.format(transaction.amount)}</td>
        <td>
          <div class="table-actions">
            <button class="small-button" type="button" data-action="edit" data-id="${transaction.id}">Edit</button>
            <button class="small-button" type="button" data-action="delete" data-id="${transaction.id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderIncome() {
  const table = document.getElementById("incomeTable");
  const monthlyIncome = getSelectedMonthIncome();

  renderIncomeCategories("incomeSummaryList", monthlyIncome);

  const sorted = [...incomeEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!sorted.length) {
    table.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">No income entries yet.</div>
        </td>
      </tr>
    `;
    return;
  }

  table.innerHTML = sorted.map(entry => {
    const date = new Date(entry.date);
    const dateLabel = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

    return `
      <tr>
        <td>${dateLabel}</td>
        <td>${escapeHtml(entry.category)}</td>
        <td>${escapeHtml(entry.notes || "")}</td>
        <td class="right">${currency.format(entry.amount)}</td>
        <td>
          <button class="small-button" type="button" data-action="delete-income" data-id="${entry.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderBudgets() {
  const budgetList = document.getElementById("budgetList");
  const dashboardBudgetProgress = document.getElementById("dashboardBudgetProgress");
  const monthlyTotals = categoryTotals(getSelectedMonthTransactions());
  const entries = Object.entries(budgets).sort((a, b) => a[0].localeCompare(b[0]));

  if (!entries.length) {
    budgetList.innerHTML = `<div class="empty-state">No budgets yet.</div>`;
    dashboardBudgetProgress.innerHTML = `<div class="empty-state">Add budgets to track progress.</div>`;
    document.getElementById("budgetInsight").textContent = "Add budgets to see whether you are on track.";
    return;
  }

  const html = entries.map(([category, budget]) => {
    const spent = monthlyTotals[category] || 0;
    const percent = budget > 0 ? (spent / budget) * 100 : 0;
    const remaining = budget - spent;
    const fillClass = percent >= 100 ? "danger" : percent >= 80 ? "warning" : "";

    return `
      <div class="list-item">
        <div class="list-row">
          <strong>${escapeHtml(category)}</strong>
          <button class="small-button" type="button" data-action="delete-budget" data-category="${escapeHtml(category)}">Delete</button>
        </div>

        <div class="list-row">
          <span>Spent ${currency.format(spent)} of ${currency.format(budget)}</span>
          <strong>${Math.round(percent)}%</strong>
        </div>

        <div class="progress-bar">
          <div class="progress-fill ${fillClass}" style="width: ${Math.min(percent, 100)}%;"></div>
        </div>

        <small>${remaining >= 0 ? `${currency.format(remaining)} remaining` : `${currency.format(Math.abs(remaining))} over budget`}</small>
      </div>
    `;
  }).join("");

  budgetList.innerHTML = html;
  dashboardBudgetProgress.innerHTML = html;
  renderBudgetInsight(entries, monthlyTotals);
}

function renderBudgetInsight(budgetEntries, monthlyTotals) {
  const box = document.getElementById("budgetInsight");

  const overBudget = budgetEntries
    .map(([category, budget]) => ({
      category,
      budget,
      spent: monthlyTotals[category] || 0
    }))
    .filter(item => item.spent > item.budget)
    .sort((a, b) => (b.spent - b.budget) - (a.spent - a.budget));

  const closeToLimit = budgetEntries
    .map(([category, budget]) => ({
      category,
      budget,
      spent: monthlyTotals[category] || 0,
      percent: budget ? ((monthlyTotals[category] || 0) / budget) * 100 : 0
    }))
    .filter(item => item.percent >= 80 && item.percent <= 100)
    .sort((a, b) => b.percent - a.percent);

  if (overBudget.length) {
    const item = overBudget[0];
    box.textContent = `${item.category} is over budget by ${currency.format(item.spent - item.budget)}.`;
    return;
  }

  if (closeToLimit.length) {
    const item = closeToLimit[0];
    box.textContent = `${item.category} is at ${Math.round(item.percent)}% of its monthly budget.`;
    return;
  }

  box.textContent = "Your budgeted categories are currently on track for the selected month.";
}

function renderSavings() {
  if (!savingsPlan) return;

  const monthlyIncome = sumEntries(getSelectedMonthIncome());
  const monthlySpending = sumEntries(getSelectedMonthTransactions());

  const monthlyNeeded = savingsPlan.goal / savingsPlan.months;
  const weeklyNeeded = monthlyNeeded / 4.333;
  const cushion = monthlyIncome - monthlySpending - monthlyNeeded;
  const percentOfIncome = monthlyIncome ? (monthlyNeeded / monthlyIncome) * 100 : 0;

  document.getElementById("monthlySavings").textContent = currency.format(monthlyNeeded);
  document.getElementById("weeklySavings").textContent = currency.format(weeklyNeeded);
  document.getElementById("savingsCushion").textContent = currency.format(cushion);

  const badge = document.getElementById("difficultyBadge");

  let difficulty = "Easy";
  let className = "easy";

  if (!monthlyIncome) {
    difficulty = "Needs Income";
    className = "neutral";
  } else if (percentOfIncome > 35) {
    difficulty = "Very Difficult";
    className = "difficult";
  } else if (percentOfIncome > 20) {
    difficulty = "Challenging";
    className = "challenging";
  } else if (percentOfIncome > 10) {
    difficulty = "Moderate";
    className = "moderate";
  }

  badge.className = `badge ${className}`;
  badge.textContent = monthlyIncome
    ? `${difficulty} — ${percentOfIncome.toFixed(1)}% of income`
    : "Needs income data";

  let message = `To save ${currency.format(savingsPlan.goal)} in ${savingsPlan.months} month${savingsPlan.months === 1 ? "" : "s"}, set aside ${currency.format(monthlyNeeded)} per month. `;

  if (!monthlyIncome) {
    message += "Add income for the selected month to compare this savings plan to your actual earnings.";
  } else if (cushion >= 0) {
    message += `Based on selected-month income and spending, this goal looks possible. You would have about ${currency.format(cushion)} left after saving.`;
  } else {
    message += `Based on selected-month income and spending, this goal is short by about ${currency.format(Math.abs(cushion))}.`;
  }

  document.getElementById("savingsInsight").textContent = message;
}

function renderCompare() {
  renderWeekComparison();
  renderMonthComparison();
  renderCategoryComparison();
  renderIncomeSpendingComparison();
}

function renderWeekComparison() {
  const container = document.getElementById("weekComparison");

  const currentRange = getPeriodDateRange("weekly");
  const previousRange = {
    start: new Date(currentRange.start),
    end: new Date(currentRange.end)
  };

  previousRange.start.setDate(previousRange.start.getDate() - 7);
  previousRange.end.setDate(previousRange.end.getDate() - 7);

  const currentSpending = sumEntries(filterByRange(transactions, currentRange));
  const previousSpending = sumEntries(filterByRange(transactions, previousRange));
  const difference = currentSpending - previousSpending;

  container.innerHTML = comparisonHtml(
    "Current week spending",
    currentSpending,
    "Previous week spending",
    previousSpending,
    difference
  );
}

function renderMonthComparison() {
  const container = document.getElementById("monthComparison");

  const month = getSelectedMonth();
  const year = getSelectedYear();

  const currentRange = {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1)
  };

  const previousRange = {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1)
  };

  const currentSpending = sumEntries(filterByRange(transactions, currentRange));
  const previousSpending = sumEntries(filterByRange(transactions, previousRange));
  const difference = currentSpending - previousSpending;

  container.innerHTML = comparisonHtml(
    "Selected month spending",
    currentSpending,
    "Previous month spending",
    previousSpending,
    difference
  );
}

function renderCategoryComparison() {
  const container = document.getElementById("categoryComparison");
  const selected = categoryTotals(getSelectedMonthTransactions());

  const previousMonthRange = {
    start: new Date(getSelectedYear(), getSelectedMonth() - 1, 1),
    end: new Date(getSelectedYear(), getSelectedMonth(), 1)
  };

  const previous = categoryTotals(filterByRange(transactions, previousMonthRange));
  const categories = [...new Set([...Object.keys(selected), ...Object.keys(previous)])];

  if (!categories.length) {
    container.innerHTML = `<div class="empty-state">No category data to compare yet.</div>`;
    return;
  }

  container.innerHTML = categories.sort().map(category => {
    const currentAmount = selected[category] || 0;
    const previousAmount = previous[category] || 0;
    const diff = currentAmount - previousAmount;

    return `
      <div class="list-item">
        <div class="list-row">
          <strong>${escapeHtml(category)}</strong>
          <span class="${diff <= 0 ? "positive" : "negative"}">${diff >= 0 ? "+" : ""}${currency.format(diff)}</span>
        </div>
        <div class="list-row">
          <span>This month: ${currency.format(currentAmount)}</span>
          <span>Previous: ${currency.format(previousAmount)}</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderIncomeSpendingComparison() {
  const container = document.getElementById("incomeSpendingComparison");
  const year = getSelectedYear();

  let html = "";

  for (let month = 0; month < 12; month++) {
    const range = {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 1)
    };

    const spent = sumEntries(filterByRange(transactions, range));
    const earned = sumEntries(filterByRange(incomeEntries, range));
    const net = earned - spent;

    html += `
      <div class="list-item">
        <div class="list-row">
          <strong>${monthNames[month]}</strong>
          <span class="${net >= 0 ? "positive" : "negative"}">${currency.format(net)}</span>
        </div>
        <div class="list-row">
          <span>Income: ${currency.format(earned)}</span>
          <span>Spent: ${currency.format(spent)}</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function comparisonHtml(currentLabel, currentAmount, previousLabel, previousAmount, difference) {
  const differenceClass = difference <= 0 ? "positive" : "negative";
  const phrase = difference <= 0
    ? `down ${currency.format(Math.abs(difference))}`
    : `up ${currency.format(difference)}`;

  return `
    <div class="list-item">
      <div class="list-row">
        <span>${currentLabel}</span>
        <strong>${currency.format(currentAmount)}</strong>
      </div>
      <div class="list-row">
        <span>${previousLabel}</span>
        <strong>${currency.format(previousAmount)}</strong>
      </div>
      <div class="list-row">
        <span>Change</span>
        <strong class="${differenceClass}">${phrase}</strong>
      </div>
    </div>
  `;
}

function exportCsv() {
  const rows = [
    ["type", "date", "amount", "category", "merchant", "notes"]
  ];

  transactions.forEach(transaction => {
    rows.push([
      "spending",
      formatDateForCsv(transaction.date),
      transaction.amount,
      transaction.category,
      transaction.merchant || "",
      transaction.notes || ""
    ]);
  });

  incomeEntries.forEach(entry => {
    rows.push([
      "income",
      formatDateForCsv(entry.date),
      entry.amount,
      entry.category,
      "",
      entry.notes || ""
    ]);
  });

  if (rows.length === 1) {
    alert("There is no data to export.");
    return;
  }

  const csv = rows.map(row => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "finance-tracker-data.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function importCsv(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const imported = parseCsv(String(reader.result || ""));

    transactions = [...transactions, ...imported.transactions];
    incomeEntries = [...incomeEntries, ...imported.income];

    saveToStorage(STORAGE_KEYS.transactions, transactions);
    saveToStorage(STORAGE_KEYS.income, incomeEntries);

    renderApp();

    alert(`Imported ${imported.transactions.length} spending entries and ${imported.income.length} income entries.`);
  };

  reader.readAsText(file);
  event.target.value = "";
}

function parseCsv(csv) {
  const lines = csv.split(/\r?\n/).filter(line => line.trim());

  const result = {
    transactions: [],
    income: []
  };

  if (lines.length < 2) return result;

  const headers = splitCsvLine(lines[0]).map(header => header.trim().toLowerCase());

  lines.slice(1).forEach(line => {
    const values = splitCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    const date = new Date(row.date);
    const amount = Number(row.amount);

    if (Number.isNaN(date.getTime()) || !amount || amount <= 0 || !row.category) return;

    if (row.type === "income") {
      result.income.push({
        id: createId(),
        date: date.toISOString(),
        amount,
        category: row.category,
        notes: row.notes || ""
      });
    } else {
      result.transactions.push({
        id: createId(),
        date: date.toISOString(),
        amount,
        category: row.category,
        merchant: row.merchant || "",
        notes: row.notes || ""
      });
    }
  });

  return result;
}

function formatDateForCsv(dateString) {
  const date = new Date(dateString);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function csvEscape(value) {
  const stringValue = String(value ?? "");

  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}