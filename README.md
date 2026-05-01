# Fenmo Expense Tracker

A simple expense tracker where you can add, view, filter and sort your expenses.

- **Live app:** https://fenmo-expense-tracker-wheat.vercel.app
- **Backend API:** https://fenmo-expense-tracker-a7bk.onrender.com/health

---

## What it does

- Add an expense with amount, category, description and date
- View all expenses in a list
- Filter by category (Food, Transport, Shopping etc.)
- Sort by newest or oldest date
- Shows total amount for the current list
- Paginated — loads 20 at a time

---

## Tech used

- **Backend** — Node.js + Express
- **Database** — PostgreSQL (hosted on Neon)
- **Frontend** — React + Vite
- **Deployed on** — Render (backend), Vercel (frontend)

---

## Design decisions

**1) Storing money correctly**

I used `NUMERIC(12,2)` in PostgreSQL instead of a float. Floats have precision issues — for example `0.1 + 0.2` in JavaScript gives `0.30000000000000004`, not `0.30`. Since this is a money app, exact values matter. I also return the amount as a string from the DB so JavaScript never converts it to a float.

**2) Handling retries safely (idempotency)**

If someone submits an expense and their internet drops before they get a response, they'll probably hit submit again. Without any protection, that creates two identical records. To fix this, the frontend generates a unique ID (UUID) for each form submission. The backend uses `INSERT ... ON CONFLICT DO NOTHING` — so if the same request comes in twice, only one record is saved. I also added a guard on the submit button so double-clicking doesn't fire two requests.

**3) Input validation**

All validation runs in one place (`validateExpense` function) before touching the database. Checks things like — amount must be positive, max 2 decimal places, category must be from the allowed list, description can't be empty or over 255 characters. The DB also has a `CHECK (amount > 0)` constraint as a backup.

**4) Pagination**

Instead of loading all expenses at once (which could be thousands), the list loads 20 at a time. The total count and the data are fetched in parallel so it's fast.

**5) Database indexes**

Added indexes on the `category` and `date` columns. This makes filtering and sorting fast — without indexes, every query scans the whole table.

**6) Security and reliability**

- `helmet` — adds basic security headers to every response
- `express-rate-limit` — limits each IP to 100 requests per 15 minutes
- Morgan — logs every request so issues are easier to debug
- Global error handler — errors never expose stack traces to the user
- Graceful shutdown — when the server is restarting, it finishes current requests before stopping

---

## What I skipped and why

**Authentication** — not in the requirements. Adding login/signup properly (password hashing, JWT, token refresh) would take a lot of time and isn't what this exercise is testing.

**Redis caching** — for a personal expense tracker, PostgreSQL with indexes is already fast enough. Adding Redis just means more complexity and more things that can break.

**Prisma ORM** — the idempotency logic needs raw SQL anyway (`ON CONFLICT`), so using an ORM wouldn't actually remove any raw queries. Raw `pg` is simpler here.

**Automated tests** — setting up proper integration tests for a Postgres-backed API needs a test database and some setup. I manually tested all the main cases including retries, double-clicks, edge case inputs and filtering.

---

## Running locally

```bash
# backend
cd backend
npm install
# add a .env file with DATABASE_URL set to your postgres connection string
npm run dev    # starts on port 4000

# frontend
cd frontend
npm install
npm run dev    # starts on port 5173
```
