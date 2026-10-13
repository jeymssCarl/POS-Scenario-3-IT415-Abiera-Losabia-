/* app.js — Entry point. Wires the DOM to the logic modules. */

"use strict";

(function () {
  /* ---------- Application state ---------- */

  const cart = createCart();
  let currentTransaction = null;

  /** Notification log for this browser session. */
  const notifications = [];

  /** Session-level stats for the profile panel. */
  const sessionStats = {
    transactions: 0,
    totalCollected: 0  // in centavos
  };

  /* ---------- Screen switching ---------- */

  const SCREEN_IDS = ["ordering", "payment", "receipt"];

  function showScreen(name) {
    if (SCREEN_IDS.indexOf(name) === -1) return;
    SCREEN_IDS.forEach(function (id) {
      const el = document.getElementById("screen-" + id);
      if (!el) return;
      if (id === name) el.classList.add("active");
      else el.classList.remove("active");
    });
    renderProcessIndicator();
  }

  /* ---------- Process indicator ---------- */

  function computeProcessState() {
    const activeScreen = SCREEN_IDS.find(function (id) {
      const el = document.getElementById("screen-" + id);
      return el && el.classList.contains("active");
    }) || "ordering";

    const hasItems = cart.items.length > 0;
    let current = 1;
    if (activeScreen === "payment") current = 3;
    else if (activeScreen === "receipt") current = 4;
    else current = hasItems ? 2 : 1;

    return { current: current };
  }

  function renderProcessIndicator() {
    const host = document.getElementById("process-indicator");
    if (!host) return;

    const steps = [
      { n: 1, label: "Browse & Add", hint: "Pick products" },
      { n: 2, label: "Review Order", hint: "Check totals" },
      { n: 3, label: "Payment",      hint: "Enter cash" },
      { n: 4, label: "Receipt",      hint: "Done" }
    ];

    const current = computeProcessState().current;

    let html = '<div class="process-card">';
    html += '<div class="process-track" aria-hidden="true">';
    for (let i = 1; i <= 4; i++) {
      let cls = "process-track-segment";
      if (i < current) cls += " done";
      else if (i === current) cls += " active";
      html += '<div class="' + cls + '"></div>';
    }
    html += '</div>';

    html += '<div class="process-steps">';
    steps.forEach(function (step) {
      let cls = "process-step";
      if (step.n < current) cls += " done";
      else if (step.n === current) cls += " active";
      const mark = step.n < current ? "✓" : String(step.n);
      html += '<div class="' + cls + '">';
      html +=   '<div class="process-step-icon" aria-hidden="true">' + mark + '</div>';
      html +=   '<div class="process-step-label">' + step.label + '</div>';
      html +=   '<div class="process-step-hint">' + step.hint + '</div>';
      html += '</div>';
    });
    html += '</div></div>';

    host.innerHTML = html;
  }

  /* ---------- Utility ---------- */

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  /* ---------- Notifications ---------- */

  function pushNotification(txn) {
    notifications.unshift({
      id: "n-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      title: "Transaction completed — " + txn.reference,
      meta: formatTime(new Date()),
      amount: txn.total,
      read: false
    });
    renderNotifications();
  }

  function renderNotifications() {
    const badge = document.getElementById("notification-badge");
    const list = document.getElementById("notification-list");
    if (!badge || !list) return;

    const unread = notifications.filter(function (n) { return !n.read; }).length;

    if (unread > 0) {
      badge.textContent = String(unread);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }

    if (notifications.length === 0) {
      list.innerHTML = '<div class="dropdown-empty">No notifications yet.</div>';
      return;
    }

    let html = "";
    notifications.forEach(function (n) {
      const cls = "notification-item " + (n.read ? "read" : "unread");
      html += '<div class="' + cls + '" data-id="' + n.id + '">';
      html +=   '<span class="notification-dot" aria-hidden="true"></span>';
      html +=   '<div class="notification-body">';
      html +=     '<div class="notification-title">' + escapeHtml(n.title) + '</div>';
      html +=     '<div class="notification-meta">';
      html +=       '<span>' + escapeHtml(n.meta) + '</span>';
      html +=       '<span class="notification-amount">' + formatPeso(n.amount) + '</span>';
      html +=     '</div>';
      html +=   '</div>';
      html += '</div>';
    });
    list.innerHTML = html;
  }

  function markNotificationRead(id) {
    const n = notifications.find(function (x) { return x.id === id; });
    if (n && !n.read) {
      n.read = true;
      renderNotifications();
    }
  }

  function markAllNotificationsRead() {
    let changed = false;
    notifications.forEach(function (n) {
      if (!n.read) { n.read = true; changed = true; }
    });
    if (changed) renderNotifications();
  }

  /* ---------- Profile ---------- */

  function renderProfile() {
    const countEl = document.getElementById("profile-txn-count");
    const totalEl = document.getElementById("profile-txn-total");
    if (countEl) countEl.textContent = String(sessionStats.transactions);
    if (totalEl) totalEl.textContent = formatPeso(sessionStats.totalCollected);
  }

  /* ---------- Dropdown open/close ---------- */

  function closeAllDropdowns() {
    const nPanel = document.getElementById("notification-panel");
    const pPanel = document.getElementById("profile-panel");
    const nBtn = document.getElementById("btn-notification");
    const pBtn = document.getElementById("btn-profile");
    if (nPanel) nPanel.hidden = true;
    if (pPanel) pPanel.hidden = true;
    if (nBtn) nBtn.setAttribute("aria-expanded", "false");
    if (pBtn) pBtn.setAttribute("aria-expanded", "false");
  }

  function toggleDropdown(which) {
    const nPanel = document.getElementById("notification-panel");
    const pPanel = document.getElementById("profile-panel");
    const nBtn = document.getElementById("btn-notification");
    const pBtn = document.getElementById("btn-profile");
    if (!nPanel || !pPanel || !nBtn || !pBtn) return;

    if (which === "notification") {
      const willOpen = nPanel.hidden;
      closeAllDropdowns();
      if (willOpen) {
        nPanel.hidden = false;
        nBtn.setAttribute("aria-expanded", "true");
      }
    } else {
      const willOpen = pPanel.hidden;
      closeAllDropdowns();
      if (willOpen) {
        pPanel.hidden = false;
        pBtn.setAttribute("aria-expanded", "true");
      }
    }
  }

  /* ---------- Product panel (R1, R2) ---------- */

  function renderProducts() {
    const panel = document.getElementById("product-panel");
    if (!panel) return;

    let html = '<h2 class="panel-title">Menu</h2>';
    html += '<div class="product-grid">';

    PRODUCTS.forEach(function (product) {
      html += '<div class="product-card" data-product-id="' + product.id + '">';
      html +=   '<div>';
      html +=     '<div class="product-name">' + escapeHtml(product.name) + '</div>';
      html +=     '<div class="product-price">' + formatPeso(product.price) + '</div>';
      html +=   '</div>';
      html +=   '<button type="button" class="btn btn-add" data-action="add" data-product-id="' + product.id + '">Add</button>';
      html += '</div>';
    });

    html += '</div>';
    panel.innerHTML = html;
  }

  /* ---------- Cart panel (R3, R4, R5, R6) ---------- */

  function renderCart() {
    const panel = document.getElementById("cart-panel");
    if (!panel) return;

    let html = '<h2 class="panel-title">Order Summary</h2>';

    if (cart.items.length === 0) {
      html += '<div class="cart-empty">Cart is empty.</div>';
    } else {
      html += '<table class="cart-table">';
      html +=   '<thead><tr>';
      html +=     '<th>Product</th>';
      html +=     '<th class="num">Qty</th>';
      html +=     '<th class="num">Subtotal</th>';
      html +=     '<th>Actions</th>';
      html +=   '</tr></thead><tbody>';

      cart.items.forEach(function (item) {
        const product = getProductById(item.productId);
        if (!product) return;
        const subtotal = getSubtotal(item);

        html += '<tr data-product-id="' + item.productId + '">';
        html +=   '<td>' + escapeHtml(product.name) + '</td>';
        html +=   '<td class="num">' + item.quantity + '</td>';
        html +=   '<td class="num">' + formatPeso(subtotal) + '</td>';
        html +=   '<td><div class="actions">';
        html +=     '<button type="button" class="btn-icon" data-action="decrement" data-product-id="' + item.productId + '" aria-label="Decrease quantity">−</button>';
        html +=     '<button type="button" class="btn-icon" data-action="increment" data-product-id="' + item.productId + '" aria-label="Increase quantity">+</button>';
        html +=     '<button type="button" class="btn btn-danger" data-action="remove" data-product-id="' + item.productId + '">Remove</button>';
        html +=   '</div></td>';
        html += '</tr>';
      });

      html += '</tbody></table>';
    }

    html += '<div class="cart-total-row">';
    html +=   '<span class="label">TOTAL</span>';
    html +=   '<span class="value">' + formatPeso(getTotal(cart)) + '</span>';
    html += '</div>';

    html += '<div class="cart-footer">';
    html +=   '<button type="button" id="btn-proceed" class="btn btn-primary"' +
              (cart.items.length === 0 ? ' disabled' : '') + '>Proceed to Payment</button>';
    html += '</div>';

    panel.innerHTML = html;
    renderProcessIndicator();
  }

  /* ---------- Payment panel (R7, R8, R9, R10) ---------- */

  function renderPayment() {
    const panel = document.getElementById("payment-panel");
    if (!panel) return;

    const total = getTotal(cart);

    let html = '<h2 class="panel-title">Payment</h2>';
    html += '<div class="payment-row total-due">';
    html +=   '<span class="label">TOTAL AMOUNT DUE</span>';
    html +=   '<span class="value">' + formatPeso(total) + '</span>';
    html += '</div>';

    html += '<div class="payment-input-group">';
    html +=   '<label for="cash-input">Amount Paid (Cash)</label>';
    html +=   '<div class="payment-input-wrap">';
    html +=     '<span class="peso-prefix">₱</span>';
    html +=     '<input type="text" id="cash-input" inputmode="decimal" autocomplete="off" placeholder="0.00">';
    html +=   '</div>';
    html +=   '<div id="payment-error" class="feedback error" role="alert"></div>';
    html += '</div>';

    html += '<div class="payment-actions">';
    html +=   '<button type="button" id="btn-back" class="btn btn-secondary">Back to Order</button>';
    html +=   '<button type="button" id="btn-confirm" class="btn btn-primary">Confirm Payment</button>';
    html += '</div>';

    panel.innerHTML = html;
  }

  function showPaymentError(message) {
    const errorBox = document.getElementById("payment-error");
    const input = document.getElementById("cash-input");
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.add("show", "error");
      errorBox.classList.remove("success");
    }
    if (input) {
      input.classList.add("has-error");
      input.focus();
    }
  }

  function clearPaymentError() {
    const errorBox = document.getElementById("payment-error");
    const input = document.getElementById("cash-input");
    if (errorBox) {
      errorBox.textContent = "";
      errorBox.classList.remove("show", "error", "success");
    }
    if (input) input.classList.remove("has-error");
  }

  function handleConfirmPayment() {
    const input = document.getElementById("cash-input");
    if (!input) return;

    const total = getTotal(cart);
    if (total <= 0) {
      showPaymentError("Cart is empty. Please add items before paying.");
      return;
    }

    const result = validatePayment(input.value, total);
    if (!result.ok) {
      showPaymentError(result.message);
      return;
    }

    clearPaymentError();

    const change = computeChange(result.amountCentavos, total);
    const reference = generateReference();
    const txn = createTransaction(
      reference,
      cart.items,
      total,
      result.amountCentavos,
      change
    );

    currentTransaction = txn;

    // Session stats + notification
    sessionStats.transactions += 1;
    sessionStats.totalCollected += txn.total;
    pushNotification(txn);
    renderProfile();

    renderReceipt();
    showScreen("receipt");
  }

  /* ---------- Receipt panel (R11, R12) ---------- */

  function renderReceipt() {
    const panel = document.getElementById("receipt-panel");
    if (!panel) return;

    if (!currentTransaction) {
      panel.innerHTML = '<h2 class="panel-title">Receipt</h2>' +
                        '<div class="cart-empty">No transaction to display.</div>';
      return;
    }

    const txn = currentTransaction;

    let html = '<h2 class="panel-title">Receipt</h2>';
    html += '<div class="feedback success show">Payment successful.</div>';
    html += '<pre id="receipt-text">' + escapeHtml(formatReceipt(txn)) + '</pre>';
    html += '<div class="cart-footer">';
    html +=   '<button type="button" id="btn-new-txn" class="btn btn-primary">New Transaction</button>';
    html += '</div>';

    panel.innerHTML = html;
  }

  function handleNewTransaction() {
    clearCart(cart);
    currentTransaction = null;
    clearPaymentError();
    renderCart();
    renderPayment();
    showScreen("ordering");
  }

  /* ---------- Event handling ---------- */

  function handleProductClick(event) {
    const btn = event.target.closest('button[data-action="add"]');
    if (!btn) return;
    const productId = Number(btn.dataset.productId);
    addItem(cart, productId);
    renderCart();
  }

  function handleCartClick(event) {
    const btn = event.target.closest("button[data-action], button#btn-proceed");
    if (!btn) return;

    if (btn.id === "btn-proceed") {
      if (cart.items.length === 0) return;
      renderPayment();
      showScreen("payment");
      const input = document.getElementById("cash-input");
      if (input) input.focus();
      return;
    }

    const action = btn.dataset.action;
    const productId = Number(btn.dataset.productId);

    if (action === "increment") { increment(cart, productId); renderCart(); }
    else if (action === "decrement") { decrement(cart, productId); renderCart(); }
    else if (action === "remove") { removeItem(cart, productId); renderCart(); }
  }

  function handlePaymentClick(event) {
    const btn = event.target.closest("button");
    if (!btn) return;
    if (btn.id === "btn-back") {
      renderCart();
      showScreen("ordering");
    } else if (btn.id === "btn-confirm") {
      handleConfirmPayment();
    }
  }

  function handlePaymentInput(event) {
    if (event.target.id !== "cash-input") return;
    clearPaymentError();
  }

  function handlePaymentKeydown(event) {
    if (event.key === "Enter" && event.target.id === "cash-input") {
      event.preventDefault();
      handleConfirmPayment();
    }
  }

  function handleReceiptClick(event) {
    const btn = event.target.closest("#btn-new-txn");
    if (!btn) return;
    handleNewTransaction();
  }

  function handleNotificationPanelClick(event) {
    const item = event.target.closest(".notification-item");
    if (!item) return;
    markNotificationRead(item.dataset.id);
  }

  /* ---------- Boot ---------- */

  function init() {
    renderProducts();
    renderCart();
    renderNotifications();
    renderProfile();

    const productPanel = document.getElementById("product-panel");
    if (productPanel) productPanel.addEventListener("click", handleProductClick);

    const cartPanel = document.getElementById("cart-panel");
    if (cartPanel) cartPanel.addEventListener("click", handleCartClick);

    const paymentPanel = document.getElementById("payment-panel");
    if (paymentPanel) {
      paymentPanel.addEventListener("click", handlePaymentClick);
      paymentPanel.addEventListener("input", handlePaymentInput);
      paymentPanel.addEventListener("keydown", handlePaymentKeydown);
    }

    const receiptPanel = document.getElementById("receipt-panel");
    if (receiptPanel) receiptPanel.addEventListener("click", handleReceiptClick);

    // Notification and profile dropdowns
    const nBtn = document.getElementById("btn-notification");
    if (nBtn) nBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleDropdown("notification");
    });

    const pBtn = document.getElementById("btn-profile");
    if (pBtn) pBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleDropdown("profile");
    });

    const nPanel = document.getElementById("notification-panel");
    if (nPanel) {
      nPanel.addEventListener("click", function (e) { e.stopPropagation(); });
      nPanel.addEventListener("click", handleNotificationPanelClick);
    }

    const pPanel = document.getElementById("profile-panel");
    if (pPanel) pPanel.addEventListener("click", function (e) { e.stopPropagation(); });

    const markAllBtn = document.getElementById("btn-mark-all-read");
    if (markAllBtn) markAllBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      markAllNotificationsRead();
    });

    // Click outside closes any open dropdown
    document.addEventListener("click", closeAllDropdowns);

    // Escape key closes dropdowns
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAllDropdowns();
    });

    showScreen("ordering");
  }

  window.POSApp = {
    cart: cart,
    showScreen: showScreen,
    renderCart: renderCart,
    renderProducts: renderProducts,
    renderPayment: renderPayment,
    renderReceipt: renderReceipt,
    renderProcessIndicator: renderProcessIndicator,
    renderNotifications: renderNotifications,
    getCurrentTransaction: function () { return currentTransaction; },
    setCurrentTransaction: function (txn) { currentTransaction = txn; },
    getNotifications: function () { return notifications; },
    getSessionStats: function () { return sessionStats; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();