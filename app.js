const express = require('express');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/foods', async (req, res) => {
  try {
    const [foods] = await db.query(
      'SELECT food_id, food_name, category, price, description, available FROM foods ORDER BY food_id'
    );
    res.json(foods);
  } catch (error) {
    console.error('Could not load foods:', error.message);
    res.status(500).json({ error: 'Could not load foods from the database.' });
  }
});

app.post('/api/foods', async (req, res) => {
  const { food_name, category, price, description = '', available = true } = req.body;
  const cleanName = typeof food_name === 'string' ? food_name.trim() : '';
  const cleanDescription = typeof description === 'string' ? description.trim() : '';
  const numericPrice = Number(price);
  if (!cleanName || cleanName.length > 100 || !['veg', 'non-veg'].includes(category) || !Number.isFinite(numericPrice) || numericPrice < 0 || cleanDescription.length > 2000) {
    return res.status(400).json({ error: 'Enter a name, valid category, price, and description.' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO foods (food_name, category, price, description, available) VALUES (?, ?, ?, ?, ?)',
      [cleanName, category, numericPrice.toFixed(2), cleanDescription, Boolean(available)]
    );
    res.status(201).json({ food_id: result.insertId, message: 'Food added.' });
  } catch (error) {
    console.error('Could not add food:', error.message);
    res.status(500).json({ error: 'Could not add food to the database.' });
  }
});

app.put('/api/foods/:id', async (req, res) => {
  const foodId = Number(req.params.id);
  const { food_name, category, price, description = '', available } = req.body;
  const cleanName = typeof food_name === 'string' ? food_name.trim() : '';
  const cleanDescription = typeof description === 'string' ? description.trim() : '';
  const numericPrice = Number(price);
  if (!Number.isInteger(foodId) || foodId < 1 || !cleanName || cleanName.length > 100 || !['veg', 'non-veg'].includes(category) || !Number.isFinite(numericPrice) || numericPrice < 0 || cleanDescription.length > 2000 || typeof available !== 'boolean') {
    return res.status(400).json({ error: 'Food details are invalid.' });
  }
  try {
    const [result] = await db.execute(
      'UPDATE foods SET food_name = ?, category = ?, price = ?, description = ?, available = ? WHERE food_id = ?',
      [cleanName, category, numericPrice.toFixed(2), cleanDescription, available, foodId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Food item not found.' });
    res.json({ message: 'Food updated.' });
  } catch (error) {
    console.error('Could not update food:', error.message);
    res.status(500).json({ error: 'Could not update food in the database.' });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT o.order_id, o.customer_name, o.phone, o.total_amount, o.order_date,
              oi.food_id, f.food_name, oi.quantity, oi.unit_price
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       JOIN foods f ON f.food_id = oi.food_id
       ORDER BY o.order_date DESC, o.order_id DESC, oi.order_item_id`
    );
    res.json(rows);
  } catch (error) {
    console.error('Could not load orders:', error.message);
    res.status(500).json({ error: 'Could not load orders from the database.' });
  }
});

app.post('/api/orders', async (req, res) => {
  const customerName = typeof req.body.customer_name === 'string'
    ? req.body.customer_name.trim()
    : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const items = req.body.items;

  if (!customerName || customerName.length > 100 || !phone || phone.length > 20) {
    return res.status(400).json({ error: 'Enter a name and phone number.' });
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return res.status(400).json({ error: 'Add at least one food item to your order.' });
  }

  const quantities = new Map();
  for (const item of items) {
    const foodId = Number(item.food_id);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(foodId) || foodId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({ error: 'One of the food quantities is invalid.' });
    }
    quantities.set(foodId, (quantities.get(foodId) || 0) + quantity);
    if (quantities.get(foodId) > 99) {
      return res.status(400).json({ error: 'A food quantity cannot be more than 99.' });
    }
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const foodIds = [...quantities.keys()];
    const [foods] = await connection.query(
      'SELECT food_id, food_name, price FROM foods WHERE food_id IN (?) AND available = TRUE FOR UPDATE',
      [foodIds]
    );
    if (foods.length !== foodIds.length) {
      await connection.rollback();
      return res.status(400).json({ error: 'A selected item is unavailable. Refresh the menu and try again.' });
    }

    let totalCents = 0;
    const orderLines = foods.map((food) => {
      const cents = Math.round(Number(food.price) * 100);
      const quantity = quantities.get(food.food_id);
      totalCents += cents * quantity;
      return { foodId: food.food_id, quantity, cents };
    });

    const [orderResult] = await connection.execute(
      'INSERT INTO orders (customer_name, phone, total_amount) VALUES (?, ?, ?)',
      [customerName, phone, (totalCents / 100).toFixed(2)]
    );
    for (const line of orderLines) {
      await connection.execute(
        'INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderResult.insertId, line.foodId, line.quantity, (line.cents / 100).toFixed(2)]
      );
    }

    await connection.commit();
    res.status(201).json({
      message: 'Your order has been placed!',
      order_id: orderResult.insertId,
      total_amount: (totalCents / 100).toFixed(2)
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Could not place order:', error.message);
    res.status(500).json({ error: 'Could not save your order. Please try again.' });
  } finally {
    if (connection) connection.release();
  }
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Food Ordering System running at http://localhost:${port}`);
});
