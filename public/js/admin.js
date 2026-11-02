const foodRows = document.querySelector('#food-rows');
const orderRows = document.querySelector('#order-rows');
const foodForm = document.querySelector('#food-form');
const foodMessage = document.querySelector('#food-message');
const money = (value) => `₹${Number(value).toFixed(2)}`;

function cell(row, value, className = '') {
  const td = document.createElement('td');
  td.textContent = value;
  if (className) td.className = className;
  row.append(td);
  return td;
}

async function loadFoods() {
  try {
    const response = await fetch('/api/foods');
    const foods = await response.json();
    if (!response.ok) throw new Error(foods.error || 'Could not load foods.');
    foodRows.replaceChildren();
    foods.forEach((food) => {
      const row = document.createElement('tr');
      cell(row, food.food_name);
      cell(row, food.category);
      cell(row, money(food.price));
      cell(row, food.available ? 'Available' : 'Unavailable', `availability ${food.available ? '' : 'unavailable'}`);
      const actionCell = document.createElement('td');
      const edit = document.createElement('button');
      edit.type = 'button'; edit.className = 'table-action'; edit.textContent = 'Edit';
      edit.addEventListener('click', () => editFood(food));
      actionCell.append(edit); row.append(actionCell); foodRows.append(row);
    });
    if (!foods.length) foodRows.innerHTML = '<tr><td colspan="5">No food items found.</td></tr>';
  } catch (error) { foodRows.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`; }
}

function editFood(food) {
  foodForm.hidden = false;
  foodForm.elements.food_id.value = food.food_id;
  foodForm.elements.food_name.value = food.food_name;
  foodForm.elements.category.value = food.category;
  foodForm.elements.price.value = food.price;
  foodForm.elements.description.value = food.description || '';
  foodForm.elements.available.checked = Boolean(food.available);
  foodMessage.textContent = 'Editing this food item.';
  foodForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.querySelector('#new-food').addEventListener('click', () => {
  foodForm.reset(); foodForm.hidden = false; foodForm.elements.food_id.value = '';
  foodForm.elements.available.checked = true; foodMessage.textContent = 'Add a new menu item.';
  foodForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
document.querySelector('#cancel-edit').addEventListener('click', () => { foodForm.reset(); foodForm.hidden = true; });

foodForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = foodForm.elements.food_id.value;
  const data = {
    food_name: foodForm.elements.food_name.value,
    category: foodForm.elements.category.value,
    price: foodForm.elements.price.value,
    description: foodForm.elements.description.value,
    available: foodForm.elements.available.checked
  };
  try {
    const response = await fetch(id ? `/api/foods/${id}` : '/api/foods', {
      method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not save food.');
    foodMessage.className = 'order-message success'; foodMessage.textContent = result.message;
    foodForm.reset(); foodForm.hidden = true; loadFoods();
  } catch (error) { foodMessage.className = 'order-message error'; foodMessage.textContent = error.message; }
});

async function loadOrders() {
  try {
    const response = await fetch('/api/admin/orders');
    const rows = await response.json();
    if (!response.ok) throw new Error(rows.error || 'Could not load orders.');
    const grouped = new Map();
    rows.forEach((row) => {
      if (!grouped.has(row.order_id)) grouped.set(row.order_id, { ...row, lines: [] });
      grouped.get(row.order_id).lines.push(`${row.food_name} × ${row.quantity}`);
    });
    orderRows.replaceChildren();
    [...grouped.values()].forEach((order) => {
      const tr = document.createElement('tr');
      cell(tr, `#${order.order_id}`); cell(tr, `${order.customer_name} (${order.phone})`);
      cell(tr, order.lines.join(', ')); cell(tr, money(order.total_amount));
      cell(tr, new Date(order.order_date).toLocaleString()); orderRows.append(tr);
    });
    if (!grouped.size) orderRows.innerHTML = '<tr><td colspan="5">No orders have been placed yet.</td></tr>';
  } catch (error) { orderRows.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`; }
}

document.querySelector('#refresh-orders').addEventListener('click', loadOrders);
loadFoods();
loadOrders();
