# Milk Tea POS — Scenario 3

A desktop-oriented, browser-based food ordering and point-of-sale (POS)
application for a milk tea and beverage stall. Built as the IT 415 Midterm
Practical Examination (Scenario 3 — Milk Tea and Beverage Shop POS) at
Davao del Norte State College, Institute of Computing. The app lets a
cashier browse six hard-coded drinks, build a cart with live quantity
controls and totals, accept a cash payment with validation, compute
change, print a digital receipt with a unique transaction reference, and
start a new transaction — all in one page, no server, no database, no
build step.

---

## Features

Everything below is implemented and verified in a browser.

- **Menu** with six drinks, names, and Philippine peso prices (R1).
- **Add to cart** from product cards; adding the same item twice merges
  the quantity (R2).
- **Quantity controls** `+` / `−` on each cart row; `−` at quantity 1
  removes the row (R3).
- **Remove** a row entirely (R4).
- **Live subtotals and total** recomputed on every cart mutation (R5).
- **Order summary** showing every current item (R6).
- **Cash input** with a ₱ prefix (R7).
- **Payment validation** with four distinct, on-screen error messages:
  - blank, whitespace, non-numeric, negative, or malformed (scientific
    notation, hex) → *"Please enter a valid payment amount."*
  - insufficient → *"Insufficient payment. Please enter at least ₱X.XX."*
  (R8).
- **Change computation** = amount paid − total (R9).
- **Payment confirmation** banner on success (R10).
- **Digital receipt** containing items, quantities, subtotals, total,
  amount paid, change, and a unique transaction reference in the form
  `MT-YYYYMMDD-NNNN` (R11).
- **New Transaction** resets the cart, the payment input, any error
  state, and returns to the ordering screen with the reference counter
  preserved (R12).
- **Process indicator** in the main area showing the cashier's current
  stage in the four-step transaction flow.
- **Navbar** with a session notification bell (unread badge + dropdown
  listing every completed transaction) and a profile view showing
  session statistics (transactions this session, total collected).
- **Console self-tests** — `cartSelfTest()` and `paymentSelfTest()`
  return a table of PASS/FAIL for each logic module.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Markup | HTML5 | Single page; three `<section>` screens toggled with a class. |
| Styling | CSS3 (no framework) | Three files: `reset.css`, `layout.css`, `components.css`. |
| Logic | Vanilla JavaScript (ES6) | No framework, no transpiler, no bundler. Plain `<script>` tags. |
| State | In-memory JS objects | No `localStorage`, no `sessionStorage`, no database. |
| Version control | Git + GitHub | Per Section IX of the exam. |
| Runtime | Any modern browser | Tested on Chrome/Edge. Works from `file://` or a local server. |

**No build step. No npm. No dependencies to install.**

---

## Installation and Setup

There is nothing to install.

### Option A — Open directly (simplest)

1. Download or clone the repository: