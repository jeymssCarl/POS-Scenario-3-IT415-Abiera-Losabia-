/* cartLogic.js — Pure cart operations. No DOM, no side effects
   except cartSelfTest which logs diagnostics. */

"use strict";

/**
 * Add a product to the cart. If it already exists, increment its quantity.
 * @param {{items:Array}} cart
 * @param {number} productId
 */
function addItem(cart, productId) {
  if (!cart || !Array.isArray(cart.items)) return;
  if (!getProductById(productId)) return;

  const existing = cart.items.find(function (it) {
    return it.productId === productId;
  });

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.items.push(createCartItem(productId, 1));
  }
}

/**
 * @param {{items:Array}} cart
 * @param {number} productId
 */
function increment(cart, productId) {
  if (!cart || !Array.isArray(cart.items)) return;
  const item = cart.items.find(function (it) {
    return it.productId === productId;
  });
  if (item) item.quantity += 1;
}

/**
 * Decrement quantity. If it would reach 0, remove the item entirely.
 * @param {{items:Array}} cart
 * @param {number} productId
 */
function decrement(cart, productId) {
  if (!cart || !Array.isArray(cart.items)) return;
  const idx = cart.items.findIndex(function (it) {
    return it.productId === productId;
  });
  if (idx === -1) return;

  if (cart.items[idx].quantity <= 1) {
    cart.items.splice(idx, 1);
  } else {
    cart.items[idx].quantity -= 1;
  }
}

/**
 * @param {{items:Array}} cart
 * @param {number} productId
 */
function removeItem(cart, productId) {
  if (!cart || !Array.isArray(cart.items)) return;
  cart.items = cart.items.filter(function (it) {
    return it.productId !== productId;
  });
}

/**
 * @param {{productId:number,quantity:number}} cartItem
 * @returns {number} subtotal in centavos
 */
function getSubtotal(cartItem) {
  const product = getProductById(cartItem.productId);
  if (!product) return 0;
  return product.price * cartItem.quantity;
}

/**
 * @param {{items:Array}} cart
 * @returns {number} total in centavos
 */
function getTotal(cart) {
  if (!cart || !Array.isArray(cart.items)) return 0;
  return cart.items.reduce(function (sum, it) {
    return sum + getSubtotal(it);
  }, 0);
}

/**
 * @param {{items:Array}} cart
 */
function clearCart(cart) {
  if (!cart) return;
  cart.items = [];
}

/* ---------- Self-test (run from browser console) ---------- */

function cartSelfTest() {
  const results = [];

  function check(name, condition) {
    results.push({ name: name, pass: !!condition });
  }

  // Add twice merges quantity
  {
    const c = createCart();
    addItem(c, 1);
    addItem(c, 1);
    check("add twice merges quantity",
      c.items.length === 1 && c.items[0].quantity === 2);
  }

  // Decrement to zero removes
  {
    const c = createCart();
    addItem(c, 1);
    decrement(c, 1);
    check("decrement to zero removes", c.items.length === 0);
  }

  // Remove missing id is a no-op
  {
    const c = createCart();
    addItem(c, 1);
    removeItem(c, 999);
    check("remove missing id is a no-op",
      c.items.length === 1 && c.items[0].productId === 1);
  }

  // Total after mixed operations
  {
    const c = createCart();
    addItem(c, 1); // 5900
    addItem(c, 1); // +5900 = 11800
    addItem(c, 6); // +2000 = 13800
    increment(c, 6); // +2000 = 15800
    decrement(c, 1); // -5900 = 9900
    check("total after mixed operations == 9900",
      getTotal(c) === 9900);
  }

  console.table(results);
  return results.every(function (r) { return r.pass; });
}