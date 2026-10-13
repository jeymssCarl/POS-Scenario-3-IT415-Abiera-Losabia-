/* app.js — Entry point. Wires the DOM to the logic modules. */

"use strict";

(function () {
  /* ---------- Application state ---------- */

  const cart = createCart();
  let currentTransaction = null;

  /* ---------- Screen switching ---------- */

  const SCREEN_IDS = ["ordering", "payment", "receipt"];

  function showScreen(name) {
    if (SCREEN_IDS.indexOf(name) === -1) return;
    SCREEN_IDS.forEach(function (id) {
      const el = document.getElementById("screen-" + id);
      if (!el) return;
      if (id === name) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
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
    html +=     '<input type="number" id="cash-input" step="0.01" min="0" inputmode="decimal" autocomplete="off" placeholder="0.00">';
    html +=   '</div>';
    html +=   '<div id="payment-error" class="feedback error" role="alert"></div>';
    html += '</div>';

    html += '<div class="payment-actions">';
    html +=   '<button type="button" id="btn-back" class="btn btn-secondary">Back to Order</button>';
    html +=   '<button type="button" id="btn-confirm" class="btn btn-primary">Confirm Payment</button>';
    html += '</div>';

    panel.innerHTML = html;
  }

  /**
   * Show an inline error under the cash input and highlight the field.
   * @param {string} message
   */
  function showPaymentError(message) {
    const errorBox = document.getElementById("payment-error");
    const input = document.getElementById("cash-input");
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.add("show");
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
      errorBox.classList.remove("show");
    }
    if (input) {
      input.classList.remove("has-error");
    }
  }

  /**
   * Handle a "Confirm Payment" click.
   * Validates, builds the Transaction, and advances to the receipt screen.
   */
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

    // M9 will render the receipt screen; for now we switch to it
    // and show a minimal placeholder so the flow is testable.
    renderReceiptPlaceholder();
    showScreen("receipt");
  }

  /* ---------- Receipt panel (placeholder until M9) ---------- */

  function renderReceiptPlaceholder() {
    const panel = document.getElementById("receipt-panel");
    if (!panel || !currentTransaction) return;

    const txn = currentTransaction;
    let html = '<h2 class="panel-title">Receipt</h2>';
    html += '<div class="feedback success show">Payment successful.</div>';
    html += '<pre id="receipt-text">' + escapeHtml(formatReceipt(txn)) + '</pre>';
    html += '<div class="cart-footer"><button type="button" id="btn-new-txn" class="btn btn-primary" disabled>New Transaction (M9)</button></div>';
    panel.innerHTML = html;
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
      return;
    }

    const action = btn.dataset.action;
    const productId = Number(btn.dataset.productId);

    if (action === "increment") {
      increment(cart, productId);
      renderCart();
    } else if (action === "decrement") {
      decrement(cart, productId);
      renderCart();
    } else if (action === "remove") {
      removeItem(cart, productId);
      renderCart();
    }
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

  function handlePaymentKeydown(event) {
    if (event.key === "Enter" && event.target.id === "cash-input") {
      event.preventDefault();
      handleConfirmPayment();
    }
  }

  /* ---------- Boot ---------- */

  function init() {
    renderProducts();
    renderCart();

    const productPanel = document.getElementById("product-panel");
    if (productPanel) {
      productPanel.addEventListener("click", handleProductClick);
    }

    const cartPanel = document.getElementById("cart-panel");
    if (cartPanel) {
      cartPanel.addEventListener("click", handleCartClick);
    }

    const paymentPanel = document.getElementById("payment-panel");
    if (paymentPanel) {
      paymentPanel.addEventListener("click", handlePaymentClick);
      paymentPanel.addEventListener("keydown", handlePaymentKeydown);
    }

    showScreen("ordering");
  }

  window.POSApp = {
    cart: cart,
    showScreen: showScreen,
    renderCart: renderCart,
    renderProducts: renderProducts,
    renderPayment: renderPayment,
    getCurrentTransaction: function () { return currentTransaction; },
    setCurrentTransaction: function (txn) { currentTransaction = txn; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();