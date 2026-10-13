/* receipt.js — Receipt text and transaction reference generation.
   Pure formatting; the UI decides where to display the result. */

"use strict";

let __receiptCounter = 0;

/**
 * Reference format: MT-YYYYMMDD-NNNN
 * Counter resets on page reload (in-memory per exam scope).
 * @returns {string}
 */
function generateReference() {
  __receiptCounter += 1;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const seq = String(__receiptCounter).padStart(4, "0");
  return "MT-" + yyyy + mm + dd + "-" + seq;
}

/**
 * @param {{reference:string, items:Array, total:number,
 *          amountPaid:number, change:number, timestamp:Date}} txn
 * @returns {string}
 */
function formatReceipt(txn) {
  if (!txn || !Array.isArray(txn.items)) {
    return "No transaction to display.";
  }

  const lines = [];
  const pad = 34;

  lines.push("        MILK TEA POS — RECEIPT");
  lines.push("--------------------------------------");
  lines.push("Reference : " + txn.reference);
  if (txn.timestamp instanceof Date) {
    lines.push("Date      : " + txn.timestamp.toLocaleString());
  }
  lines.push("--------------------------------------");

  txn.items.forEach(function (it) {
    const product = getProductById(it.productId);
    if (!product) return;
    const label = product.name + " x" + it.quantity;
    const subtotal = formatPeso(product.price * it.quantity);
    const padded = label.length >= pad
      ? label + " "
      : label + " ".repeat(pad - label.length);
    lines.push(padded + subtotal);
  });

  lines.push("--------------------------------------");
  lines.push("TOTAL        : " + formatPeso(txn.total));
  lines.push("Amount Paid  : " + formatPeso(txn.amountPaid));
  lines.push("Change       : " + formatPeso(txn.change));
  lines.push("--------------------------------------");
  lines.push("       Thank you! Please come again.");

  return lines.join("\n");
}