/* app.js — Entry point. Wires the DOM to the logic modules.
   M0 skeleton: only screen switching is in place.
   Panels are populated in M6–M9. */

"use strict";

(function () {
  const cart = createCart();

  /**
   * Show one screen and hide the others.
   * @param {"ordering"|"payment"|"receipt"} name
   */
  function showScreen(name) {
    const ids = ["ordering", "payment", "receipt"];
    ids.forEach(function (id) {
      const el = document.getElementById("screen-" + id);
      if (!el) return;
      if (id === name) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  }

  // Expose a minimal API so later modules can call into app.js
  // without rewriting the wiring. Kept intentionally small.
  window.POSApp = {
    cart: cart,
    showScreen: showScreen
  };

  // Start on the ordering screen.
  showScreen("ordering");
})();