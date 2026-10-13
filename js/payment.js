/* payment.js — Payment validation and change computation.
   No DOM. Returns structured results so the UI can render messages. */

"use strict";

/* Strict decimal format: optional integer part, optional decimal point
   with 1–2 fractional digits. Rejects "1e3", "0x10", "Infinity",
   "  ", "+-5", "1.234", and similar. */
const DECIMAL_RE = /^\d+(\.\d{1,2})?$/;

/**
 * @param {string} rawString — value from the cash input field
 * @param {number} totalCentavos
 * @returns {{ok:true, amountCentavos:number}
 *          |{ok:false, message:string}}
 */
function validatePayment(rawString, totalCentavos) {
  const invalidMsg = "Please enter a valid payment amount.";

  if (rawString === null || rawString === undefined) {
    return { ok: false, message: invalidMsg };
  }

  const trimmed = String(rawString).trim();
  if (trimmed === "") {
    return { ok: false, message: invalidMsg };
  }

  // Reject anything that is not a plain non-negative decimal
  // (this blocks 1e3, 0x10, negative numbers, and multi-dot values).
  if (!DECIMAL_RE.test(trimmed)) {
    return { ok: false, message: invalidMsg };
  }

  const paidCentavos = Math.round(parseFloat(trimmed) * 100);

  if (paidCentavos < totalCentavos) {
    return {
      ok: false,
      message: "Insufficient payment. Please enter at least " +
               formatPeso(totalCentavos) + "."
    };
  }

  return { ok: true, amountCentavos: paidCentavos };
}

/**
 * @param {number} paidCentavos
 * @param {number} totalCentavos
 * @returns {number} change in centavos
 */
function computeChange(paidCentavos, totalCentavos) {
  return paidCentavos - totalCentavos;
}

/* ---------- Self-test (run from browser console) ---------- */

function paymentSelfTest() {
  const results = [];

  function check(name, condition) {
    results.push({ name: name, pass: !!condition });
  }

  const total = 16500;

  check("blank rejected",
    validatePayment("", total).ok === false);
  check("whitespace rejected",
    validatePayment("   ", total).ok === false);
  check("non-numeric rejected",
    validatePayment("abc", total).ok === false);
  check("negative rejected",
    validatePayment("-5", total).ok === false);
  check("scientific notation rejected",
    validatePayment("1e3", total).ok === false);
  check("hex literal rejected",
    validatePayment("0x10", total).ok === false);
  check("multi-decimal rejected",
    validatePayment("1.234", total).ok === false);
  check("insufficient rejected",
    validatePayment("100", total).ok === false);
  check("valid integer accepted",
    validatePayment("200", total).ok === true);
  check("valid decimal accepted",
    validatePayment("200.50", total).ok === true);

  const valid = validatePayment("200", total);
  check("change computed correctly (200 - 165 = 35)",
    valid.ok && computeChange(valid.amountCentavos, total) === 3500);

  console.table(results);
  return results.every(function (r) { return r.pass; });
}