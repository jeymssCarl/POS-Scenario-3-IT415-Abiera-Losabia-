/* catalog.js — Product catalog for Scenario 3 (Milk Tea & Beverage Shop).
   Prices stored in centavos (integer) to avoid float rounding errors. */

"use strict";

const PRODUCTS = [
  { id: 1, name: "Classic Milk Tea (Regular)",       price: 5900 },
  { id: 2, name: "Wintermelon Milk Tea (Regular)",   price: 6500 },
  { id: 3, name: "Taro Milk Tea (Regular)",          price: 6500 },
  { id: 4, name: "Fruit Tea — Lychee (Regular)",     price: 5500 },
  { id: 5, name: "Brown Sugar Milk Tea (Regular)",   price: 6900 },
  { id: 6, name: "Bottled Water",                    price: 2000 }
];

/**
 * Look up a product by its id.
 * @param {number} id
 * @returns {{id:number,name:string,price:number}|undefined}
 */
function getProductById(id) {
  return PRODUCTS.find(function (p) { return p.id === id; });
}

/**
 * Format an integer centavo amount as a Philippine peso string.
 * @param {number} centavos
 * @returns {string} e.g. 5900 -> "₱59.00"
 */
function formatPeso(centavos) {
  if (typeof centavos !== "number" || !isFinite(centavos)) {
    return "₱0.00";
  }
  const sign = centavos < 0 ? "-" : "";
  const abs = Math.abs(Math.round(centavos));
  const pesos = Math.floor(abs / 100);
  const cents = abs % 100;
  return sign + "₱" + pesos + "." + String(cents).padStart(2, "0");
}