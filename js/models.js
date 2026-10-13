/* models.js — In-memory data models.
   Plain factory functions; no classes, no DB, no persistence. */

"use strict";

/**
 * @param {number} productId
 * @param {number} [quantity=1]
 * @returns {{productId:number, quantity:number}}
 */
function createCartItem(productId, quantity) {
  const qty = (typeof quantity === "number" && quantity > 0) ? Math.floor(quantity) : 1;
  return { productId: productId, quantity: qty };
}

/**
 * @returns {{items: Array<{productId:number,quantity:number}>}}
 */
function createCart() {
  return { items: [] };
}

/**
 * Snapshot a list of cart items so later mutations do not affect
 * the transaction that has already been recorded.
 * @param {Array<{productId:number,quantity:number}>} items
 */
function cloneItems(items) {
  return items.map(function (it) {
    return { productId: it.productId, quantity: it.quantity };
  });
}

/**
 * @param {{items:Array}} cart
 * @returns {{items:Array}}
 */
function cloneCart(cart) {
  return { items: cloneItems(cart.items) };
}

/**
 * @param {string} reference
 * @param {Array} items
 * @param {number} total
 * @param {number} amountPaid
 * @param {number} change
 */
function createTransaction(reference, items, total, amountPaid, change) {
  return {
    reference: reference,
    items: cloneItems(items),
    total: total,
    amountPaid: amountPaid,
    change: change,
    timestamp: new Date()
  };
}

/**
 * Prices are stored in centavos, so values should already be integers.
 * This helper exists for defensive rounding if future arithmetic drifts.
 * @param {number} n
 * @returns {number}
 */
function roundToCentavos(n) {
  return Math.round(n);
}