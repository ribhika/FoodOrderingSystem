const cartItems = document.querySelector('#cart-items');
const cartTotal = document.querySelector('#cart-total');
const orderForm = document.querySelector('#order-form');
const placeOrderButton = document.querySelector('#place-order');
const orderMessage = document.querySelector('#order-message');
const money = (value) => `₹${Number(value).toFixed(2)}`;

function readCart() {
  try { return JSON.parse(localStorage.getItem('food-order-cart') || '[]'); }
  catch { return []; }
}
function saveCart(cart) { localStorage.setItem('food-order-cart', JSON.stringify(cart)); }

function renderCart() {
  const cart = readCart();
  cartItems.replaceChildren();
  let total = 0;
  if (!cart.length) {
    const empty = document.createElement('p');
    empty.className = 'cart-empty';
    empty.textContent = 'Your order is empty. Go to the menu to add a dish.';
    cartItems.append(empty);
  }
  cart.forEach((item, index) => {
    const subtotal = Number(item.price) * item.quantity;
    total += subtotal;
    const row = document.createElement('div');
    row.className = 'cart-row';
    const name = document.createElement('span');
    name.className = 'cart-name';
    name.textContent = item.food_name;
    const controls = document.createElement('div');
    controls.className = 'quantity-controls';
    const minus = document.createElement('button');
    minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Remove one ${item.food_name}`);
    minus.addEventListener('click', () => changeQuantity(index, -1));
    const quantity = document.createElement('span'); quantity.textContent = item.quantity;
    const plus = document.createElement('button');
    plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Add one ${item.food_name}`);
    plus.addEventListener('click', () => changeQuantity(index, 1));
    controls.append(minus, quantity, plus);
    const amount = document.createElement('strong'); amount.textContent = money(subtotal);
    row.append(name, controls, amount);
    cartItems.append(row);
  });
  cartTotal.textContent = money(total);
  placeOrderButton.disabled = cart.length === 0;
}

function changeQuantity(index, delta) {
  const cart = readCart();
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) cart.splice(index, 1);
  if (cart[index] && cart[index].quantity > 99) cart[index].quantity = 99;
  saveCart(cart);
  renderCart();
}

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const cart = readCart();
  if (!cart.length) return;
  placeOrderButton.disabled = true;
  orderMessage.className = 'order-message';
  orderMessage.textContent = 'Saving your order…';
  const formData = new FormData(orderForm);
  try {
    const response = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: formData.get('customer_name'),
        phone: formData.get('phone'),
        items: cart.map((item) => ({ food_id: item.food_id, quantity: item.quantity }))
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not place your order.');
    localStorage.removeItem('food-order-cart');
    renderCart();
    orderForm.reset();
    orderMessage.className = 'order-message success';
    orderMessage.textContent = `Order #${result.order_id} placed! Total: ${money(result.total_amount)}.`;
  } catch (error) {
    orderMessage.className = 'order-message error';
    orderMessage.textContent = error.message;
    placeOrderButton.disabled = false;
  }
});

renderCart();
