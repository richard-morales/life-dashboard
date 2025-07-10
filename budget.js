// Reference all relevant elements
const budgetForm = document.getElementById("budget-form");
const transactionType = document.getElementById("transaction-type");
const budgetDescription = document.getElementById("budget-description");
const budgetAmount = document.getElementById("budget-amount");
const transactionSection = document.getElementById("budget-transaction");
const summarySection = document.getElementById("budget-summary");

// Currency format

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

// Save the array to localStorage

function saveTransactions(transactions) {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Load the array from localStorage
function loadTransactions() {
  const stored = localStorage.getItem("transactions");
  return stored ? JSON.parse(stored) : [];
}

// When page loads, display what's in storage
window.addEventListener("DOMContentLoaded", renderTransactions);

// Render transaction and Summary

function renderTransactions() {
  const transactions = loadTransactions();

  transactionSection.style.display = "block";
  summarySection.style.display = "block";

  // Render transactions
  if (transactions.length === 0) {
    transactionSection.innerHTML =
      "<p style='text-align:center; color:#b0b0b0'>No transactions yet.</p>";
    summarySection.innerHTML = "";
    summarySection.style.display = "none";
    return;
  }

  // Cards for each transaction
  const transactionCards = transactions
    .map(
      (t, idx) => `
    <div class="transaction-card ${t.type}">
      <div class="transaction-info">
        <span class="icon">
          ${
            t.type === "income"
              ? '<i class="fa-solid fa-circle-arrow-down"></i>'
              : '<i class="fa-solid fa-circle-arrow-up"></i>'
          }
        </span>
        <span class="description"><strong>${t.desc}</strong></span>
      </div>
      <div class="transaction-amount-group">
        <span class="amount">${t.type === "income" ? "+" : "-"}${formatCurrency(
        t.amount
      )}</span>
        <button class="delete-transaction" data-index="${idx}" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `
    )
    .join("");
  transactionSection.innerHTML = transactionCards;

  // Add delete functionality for each button
  const deleteButtons = transactionSection.querySelectorAll(
    ".delete-transaction"
  );
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const idx = this.getAttribute("data-index");
      const txs = loadTransactions();
      txs.splice(idx, 1);
      saveTransactions(txs);
      renderTransactions();
    });
  });

  // Calculate totals
  let income = 0,
    expenses = 0;
  transactions.forEach((t) => {
    if (t.type === "income") income += t.amount;
    else expenses += t.amount;
  });
  const balance = income - expenses;

  // Determine feedback message and color
  let feedbackMsg = "";
  let feedbackClass = "";
  if (income === 0 && expenses === 0) {
    feedbackMsg = "Start adding your income and expenses!";
    feedbackClass = "";
  } else if (balance > 0) {
    feedbackMsg = "You have some extra cash!";
    feedbackClass = "positive";
  } else if (balance === 0) {
    feedbackMsg = "You’ve spent exactly your budget.";
    feedbackClass = "";
  } else {
    feedbackMsg = "You’ve spent more than your income!";
    feedbackClass = "negative";
  }

  // Show summary
  summarySection.innerHTML = `
  <div class="summary-flex">
    <div class="summary-box income">
      <span class="icon"><i class="fa-solid fa-wallet"></i></span>
      <h3>Income</h3>
      <div class="summary-value">${formatCurrency(income)}</div>
    </div>
    <div class="summary-box expense">
      <span class="icon"><i class="fa-solid fa-cart-shopping"></i></span>
      <h3>Expenses</h3>
      <div class="summary-value">${formatCurrency(expenses)}</div>
    </div>
    <div class="summary-box balance">
      <span class="icon"><i class="fa-solid fa-scale-balanced"></i></span>
      <h3>Balance</h3>
      <div class="summary-value ${
        balance >= 0 ? "gain" : "loss"
      }">${formatCurrency(balance)}</div>
    </div>
  </div>
  <div class="summary-feedback ${feedbackClass}">${feedbackMsg}</div>
`;

  // Add Reset All button (only if there are transactions)
  const resetBtn = document.createElement("button");
  resetBtn.id = "reset-btn";
  resetBtn.textContent = "Reset All";
  resetBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to reset your budget and expenses? This cannot be undone."
      )
    ) {
      localStorage.removeItem("transactions");
      renderTransactions();
    }
  });
  summarySection.appendChild(resetBtn);
}

transactionSection.style.display = "block";
summarySection.style.display = "block";

// Add a new transaction

budgetForm.addEventListener("submit", (event) => {
  event.preventDefault(); // Stops default page refresh

  // Ge user inputs
  const type = transactionType.value;
  const desc = budgetDescription.value.trim();
  const amount = parseFloat(budgetAmount.value);

  // Validate Input
  if (!desc || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid description and positive amount.");
    return;
  }

  // Create transaction object
  const newTransaction = {
    type: type,
    desc: desc,
    amount: amount,
  };

  // Get current transactions
  const transactions = loadTransactions();

  // Add new transaction to array
  transactions.push(newTransaction);

  // Save back to storage
  saveTransactions(transactions);

  // Re-render UI
  renderTransactions();

  //   Clear form fields for next entry
  budgetDescription.value = "";
  budgetAmount.value = "";
});
