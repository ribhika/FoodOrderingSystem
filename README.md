# Ribhika Food Ordering System

A local food ordering website built with Node.js, Express, and MySQL.

## Features

- Shows available foods from the MySQL `foods` table.
- Filters the menu by veg and non-veg categories.
- Adds foods to a cart and saves customer orders to MySQL.
- Provides an admin page to add and edit foods and review placed orders.
- Uses separate Home, Menu, Order, and Admin pages.

## Requirements

- Node.js and npm
- MySQL Server and MySQL Workbench (or another MySQL client)

## Setup

1. Start the MySQL Server.
2. In MySQL Workbench, run `database.sql` to create the database, foods table, and sample foods. Run `orders.sql` to create the order tables. Run each setup script once. Running `database.sql` again adds the sample foods again.
3. Make sure the local database connection values are set in `.env`. Keep `.env` private; it is excluded from Git. Use `.env.example` as a template if setting up another copy.
4. Open a terminal in this project folder and install dependencies:

   ```powershell
   npm.cmd install
   ```

5. Start the website:

   ```powershell
   npm.cmd run dev
   ```

6. Open <http://localhost:3000> in a browser. Keep the terminal and MySQL Server running while using the site.

## Pages

- Home: <http://localhost:3000/>
- Menu: <http://localhost:3000/menu.html>
- Order: <http://localhost:3000/order.html>
- Admin: <http://localhost:3000/admin.html>

## Database tables

- `foods`: `food_id`, `food_name`, `category`, `price`, `description`, `available`
- `orders`: customer details, order total, and order date
- `order_items`: food items and quantities belonging to each order

The menu uses `foods`; placing an order writes to both `orders` and `order_items`.

## Useful MySQL queries

```sql
SELECT * FROM ribhika_food_ordering.foods;
SELECT * FROM ribhika_food_ordering.orders;
SELECT * FROM ribhika_food_ordering.order_items;
```

## Demo checklist

1. Open the Menu page and show the food items loaded from MySQL.
2. Open the Admin page and add or edit a food item; show the updated item on the Menu page.
3. Add a food to the cart, enter sample customer details, and place the order.
4. Show the saved order in the Admin page and in the `orders` and `order_items` tables in MySQL Workbench.
