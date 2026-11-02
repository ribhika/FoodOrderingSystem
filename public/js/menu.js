const foodList = document.querySelector('#food-list');
const menuCount = document.querySelector('#menu-count');
const categoryFilter = document.querySelector('#category-filter');
const cartCount = document.querySelector('#cart-count');
const money = (value) => `₹${Number(value).toFixed(2)}`;

function readCart() {
  try { return JSON.parse(localStorage.getItem('food-order-cart') || '[]'); }
  catch { return []; }
}

function updateCartCount() {
  const count = readCart().reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = count;
}

function makeFoodCard(food, index) {
  const card = document.createElement('article');
  card.className = 'food-card';
  card.style.setProperty('--card-index', index);
  const top = document.createElement('div');
  top.className = 'food-card-top';
  top.setAttribute('aria-hidden', 'true');
  top.textContent = food.category === 'veg' ? '🥗' : '🍗';
  const body = document.createElement('div');
  body.className = 'food-card-body';
  const titleRow = document.createElement('div');
  titleRow.className = 'food-card-title';
  const title = document.createElement('h3');
  title.textContent = food.food_name;
  const price = document.createElement('span');
  price.className = 'price';
  price.textContent = money(food.price);
  titleRow.append(title, price);
  const category = document.createElement('span');
  category.className = `category ${food.category}`;
  category.textContent = food.category;
  const description = document.createElement('p');
  description.textContent = food.description || 'Made fresh in our kitchen.';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'add-to-order';
  button.textContent = 'Add to order';
  button.addEventListener('click', () => {
    const cart = readCart();
    const existing = cart.find((item) => item.food_id === food.food_id);
    if (existing) existing.quantity = Math.min(99, existing.quantity + 1);
    else cart.push({ food_id: food.food_id, food_name: food.food_name, price: food.price, quantity: 1 });
    localStorage.setItem('food-order-cart', JSON.stringify(cart));
    updateCartCount();
    button.textContent = 'Added ✓';
    setTimeout(() => { button.textContent = 'Add to order'; }, 900);
  });
  body.append(titleRow, category, description, button);
  card.append(top, body);
  return card;
}

let availableFoods = [];
function renderMenu() {
  const category = categoryFilter.value;
  const filtered = availableFoods.filter((food) => category === 'all' || food.category === category);
  menuCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'dish' : 'dishes'}`;
  foodList.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'status-message';
    empty.textContent = 'No dishes in this category are available right now.';
    foodList.append(empty);
    return;
  }
  filtered.forEach((food, index) => foodList.append(makeFoodCard(food, index)));
}

async function loadMenu() {
  try {
    const response = await fetch('/api/foods');
    if (!response.ok) throw new Error('Could not load menu.');
    const foods = await response.json();
    availableFoods = foods.filter((food) => Boolean(food.available));
    renderMenu();
  } catch (error) {
    menuCount.textContent = '';
    foodList.innerHTML = '<p class="status-message">Menu could not load. Check that the server and database are running.</p>';
    console.error(error);
  }
}

categoryFilter.addEventListener('change', renderMenu);
window.addEventListener('storage', updateCartCount);
updateCartCount();
loadMenu();
