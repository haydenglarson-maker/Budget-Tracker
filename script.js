const STORAGE_KEYS = {
  transactions: "financeTracker.transactions",
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

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

let transactions = loadFromStorage(STORAGE_KEYS.transactions, []);
let budgets = loadFromStorage(STORAGE_KEYS.budgets, {});
let savingsPlan = loadFromStorage(STORAGE_KEYS.savings, null);

const today = new Date();

document.addEventListener("DOMContentLoaded", () => {
  setupTheme();
  setupMonthDropdowns();
  setupDefaultDates();
  setupSavedSavingsPlan();
  setupTabs();
  setupSettings();
  setupForms();
  setupFilters();
  setupTableActions();
  setupBudgetActions();
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
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
}

function setupMonthDropdowns() {
  const monthSelects = [
    document.getElementById("month"),
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

  document.getElementById("filterMonth").value = today.getMonth();
  document.getElementById("filterYear").value = today.getFullYear();
}

function setupSavedSavingsPlan() {
  if (!savingsPlan) return;

  document.getElementById("savingsGoal").value = savingsPlan.goal;
  document.getElementById("timeFrame").value = savingsPlan.months;
  document.getElementById("monthlyIncome").value = savingsPlan.income;
}

function setupTabs() {
  document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => {
      switchTab(button.dataset.tab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-button").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-section").forEach(section => {
    section.classList.toggle("active", section.id === tabId);
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

    const theme = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  });

  document.getElementById("exportCsvButton").addEventListener("click", exportCsv);

  document.getElementById("importCsvButton").addEventListener("click", () => {
    document.getElementById("csvFileInput").click();
  });

  document.getElementById("csvFileInput").addEventListener("change", importCsv);
}

function setupForms() {
  document.getElementById("transactionForm").addEventListener("submit", saveTransaction);
  document.getElementById("budgetForm").addEventListener("submit", saveBudget);
  document.getElementById("savingsForm").addEventListener("submit", saveSavingsPlan);

  document.getElementById("cancelEditButton").addEventListener("click", resetTransactionForm);

  document.getElementById("clearAllButton").addEventListener("click", () => {
    const confirmed = confirm("Are you sure you want to delete all transactions?");
    if (!confirmed) return;

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
    transactions = transactions.map(item => {
      return item.id === editingId ? transaction : item;
    });
  } else {
    transactions.push(transaction);
  }

  saveToStorage(STORAGE_KEYS.transactions, transactions);
  resetTransactionForm();
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
  document.getElementById("transactionFormTitle").textContent = "Add Transaction";
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

  document.getElementById("transactionFormTitle").textContent = "Edit Transaction";
  document.getElementById("cancelEditButton").classList.remove("hidden");

  switchTab("transactions");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteTransaction(id) {
  const confirmed = confirm("Delete this transaction?");
  if (!confirmed) return;

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
  const confirmed = confirm(`Delete the budget for ${category}?`);
  if (!confirmed) return;

  delete budgets[category];
  saveToStorage(STORAGE_KEYS.budgets, budgets);
  renderApp();
}

function saveSavingsPlan(event) {
  event.preventDefault();

  const goal = Number(document.getElementById("savingsGoal").value);
  const months = Number(document.getElementById("timeFrame").value);
  const income = Number(document.getElementById("monthlyIncome").value);

  if (goal <= 0 || months <= 0 || income <= 0) {
    alert("Please enter valid savings plan numbers.");
    return;
  }

  savingsPlan = { goal, months, income };
  saveToStorage(STORAGE_KEYS.savings, savingsPlan);
  renderApp();
}

function getSelectedMonthTransactions() {
  const month = Number(document.getElementById("filterMonth").value);
  const year = Number(document.getElementById("filterYear").value);

  return transactions.filter(transaction => {
    const date = new Date(transaction.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
}

function getCurrentWeekTransactions() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();

  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return transactions.filter(transaction => {
    const date = new Date(transaction.date);
    return date >= start && date < end;
  });
}

function sumTransactions(list) {
  return list.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

function categoryTotals(list) {
  return list.reduce((totals, transaction) => {
    totals[transaction.category] = (totals[transaction.category] || 0) + Number(transaction.amount);
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
  renderSummary();
  renderCategoryLists();
  renderCategoryChart();
  renderTransactions();
  renderBudgets();
  renderSavings();
}

function renderSummary() {
  const selectedMonthTransactions = getSelectedMonthTransactions();
  const weeklyTransactions = getCurrentWeekTransactions();

  const overallTotal = sumTransactions(transactions);
  const monthlyTotal = sumTransactions(selectedMonthTransactions);
  const weeklyTotal = sumTransactions(weeklyTransactions);

  document.getElementById("overallTotal").textContent = currency.format(overallTotal);
  document.getElementById("monthlyTotal").textContent = currency.format(monthlyTotal);
  document.getElementById("weeklyTotal").textContent = currency.format(weeklyTotal);

  const income = savingsPlan ? Number(savingsPlan.income) : 0;

  document.getElementById("incomeLeftAfterSpending").textContent = income
    ? currency.format(income - monthlyTotal)
    : "$0.00";

  renderSpendingInsight(selectedMonthTransactions, weeklyTransactions);
}

function renderSpendingInsight(monthlyTransactions, weeklyTransactions) {
  const box = document.getElementById("spendingInsight");

  if (!transactions.length) {
    box.textContent = "Add transactions to see insights.";
    return;
  }

  const selectedMonth = monthNames[Number(document.getElementById("filterMonth").value)];
  const selectedYear = document.getElementById("filterYear").value;

  const overallTotal = sumTransactions(transactions);
  const monthlyTotal = sumTransactions(monthlyTransactions);
  const weeklyTotal = sumTransactions(weeklyTransactions);

  const monthlyHigh = highestCategory(monthlyTransactions);
  const weeklyHigh = highestCategory(weeklyTransactions);

  let message = `You have spent ${currency.format(overallTotal)} total. `;
  message += `For ${selectedMonth} ${selectedYear}, you have spent ${currency.format(monthlyTotal)}. `;
  message += `This week, you have spent ${currency.format(weeklyTotal)}. `;

  if (monthlyHigh) {
    message += `Your highest monthly category is ${monthlyHigh.category} at ${currency.format(monthlyHigh.amount)}. `;
  }

  if (weeklyHigh) {
    message += `Your highest weekly category is ${weeklyHigh.category} at ${currency.format(weeklyHigh.amount)}. `;
  }

  if (savingsPlan) {
    const monthlySavingsNeeded = savingsPlan.goal / savingsPlan.months;
    const moneyLeft = savingsPlan.income - monthlyTotal;

    if (moneyLeft >= monthlySavingsNeeded) {
      message += "Based on your income and selected-month spending, your savings goal looks possible right now.";
    } else {
      message += "Your current spending may make your savings goal difficult unless you reduce expenses or extend your time frame.";
    }
  }

  box.textContent = message;
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

function renderCategoryLists() {
  renderCategoryList("overallCategories", transactions);
  renderCategoryList("monthlyCategories", getSelectedMonthTransactions());
  renderCategoryList("weeklyCategories", getCurrentWeekTransactions());
}

function renderCategoryList(elementId, list) {
  const container = document.getElementById(elementId);
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

function renderCategoryChart() {
  const container = document.getElementById("categoryChart");
  const totals = categoryTotals(getSelectedMonthTransactions());
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    container.innerHTML = `<div class="empty-state">No monthly spending to chart yet.</div>`;
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
          <div class="empty-state">No transactions match your current view.</div>
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
    box.textContent = `${item.category} is over budget by ${currency.format(item.spent - item.budget)}. This is the first category to review.`;
    return;
  }

  if (closeToLimit.length) {
    const item = closeToLimit[0];
    box.textContent = `${item.category} is at ${Math.round(item.percent)}% of its monthly budget. You are still under budget, but this category is getting close.`;
    return;
  }

  box.textContent = "Your budgeted categories are currently on track for the selected month.";
}

function renderSavings() {
  if (!savingsPlan) return;

  const monthlyNeeded = savingsPlan.goal / savingsPlan.months;
  const weeklyNeeded = monthlyNeeded / 4.333;
  const incomeAfterSavings = savingsPlan.income - monthlyNeeded;
  const percentOfIncome = (monthlyNeeded / savingsPlan.income) * 100;

  document.getElementById("monthlySavings").textContent = currency.format(monthlyNeeded);
  document.getElementById("weeklySavings").textContent = currency.format(weeklyNeeded);
  document.getElementById("incomeAfterSavings").textContent = currency.format(incomeAfterSavings);

  const badge = document.getElementById("difficultyBadge");

  let difficulty = "Easy";
  let className = "easy";

  if (percentOfIncome > 35) {
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
  badge.textContent = `${difficulty} — ${percentOfIncome.toFixed(1)}% of income`;

  const monthlySpending = sumTransactions(getSelectedMonthTransactions());
  const moneyLeftAfterSpending = savingsPlan.income - monthlySpending;

  let message = `To save ${currency.format(savingsPlan.goal)} in ${savingsPlan.months} month${savingsPlan.months === 1 ? "" : "s"}, set aside ${currency.format(monthlyNeeded)} per month or about ${currency.format(weeklyNeeded)} per week. `;
  message += `That equals ${percentOfIncome.toFixed(1)}% of your monthly income. `;

  if (monthlySpending > 0) {
    message += `Based on selected-month spending, you have about ${currency.format(moneyLeftAfterSpending)} left after expenses. `;

    if (moneyLeftAfterSpending >= monthlyNeeded) {
      message += "Your savings goal currently looks possible if your spending stays similar.";
    } else {
      message += "Your savings goal may be difficult unless you reduce spending, increase income, or extend the time frame.";
    }
  } else {
    message += "Add spending transactions to compare this plan against your real spending.";
  }

  document.getElementById("savingsInsight").textContent = message;
}

function exportCsv() {
  if (!transactions.length) {
    alert("There are no transactions to export.");
    return;
  }

  const headers = ["date", "amount", "category", "merchant", "notes"];

  const rows = transactions.map(transaction => {
    const date = new Date(transaction.date);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    return [
      formattedDate,
      transaction.amount,
      transaction.category,
      transaction.merchant || "",
      transaction.notes || ""
    ].map(csvEscape).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "finance-transactions.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function importCsv(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const imported = parseCsv(String(reader.result || ""));

    if (!imported.length) {
      alert("No valid transactions were found in the CSV.");
      return;
    }

    transactions = [...transactions, ...imported];
    saveToStorage(STORAGE_KEYS.transactions, transactions);
    renderApp();

    alert(`${imported.length} transaction${imported.length === 1 ? "" : "s"} imported.`);
  };

  reader.readAsText(file);
  event.target.value = "";
}

function parseCsv(csv) {
  const lines = csv.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(header => header.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const values = splitCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    const date = new Date(row.date);
    const amount = Number(row.amount);

    if (Number.isNaN(date.getTime()) || !amount || amount <= 0 || !row.category) {
      return null;
    }

    return {
      id: createId(),
      date: date.toISOString(),
      amount,
      category: row.category,
      merchant: row.merchant || "",
      notes: row.notes || ""
    };
  }).filter(Boolean);
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
