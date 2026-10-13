/* app.js — Entry point. Wires the DOM to the logic modules. */

"use strict";

(function () {
  /* ---------- Application state ---------- */

  const cart = createCart();
  let currentTransaction = null;

  /* ---------- Screen switching ---------- */

  const SCREEN_IDS = ["ordering", "payment", "receipt"];

  /**
   * Show one screen and hide the others.
   * @param {"ordering"|"payment"|"receipt"} name
   */
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

  /**
   * Escape user-controllable text before inserting into innerHTML.
   * Product names are hard-coded, but this prevents future regressions.
   */
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

  /* ---------- Event handling ---------- */

  function handleProductClick(event) {
    const btn = event.target.closest('button[data-action="add"]');
    if (!btn) return;
    const productId = Number(btn.dataset.productId);
    addItem(cart, productId);
    renderCart();
  }

  function handleCartClick(event) {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;

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
    } else if (btn.id === "btn-proceed") {
      // Wired in M8 — safe no-op for now.
      showScreen("payment");
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

    showScreen("ordering");
  }

  // Expose a small API so later modules (M8, M9) can reuse state.
  window.POSApp = {
    cart: cart,
    showScreen: showScreen,
    renderCart: renderCart,
    renderProducts: renderProducts,
    getCurrentTransaction: function () { return currentTransaction; },
    setCurrentTransaction: function (txn) { currentTransaction = txn; }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();