USE ribhika_food_ordering;

CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  food_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_food FOREIGN KEY (food_id)
    REFERENCES foods(food_id),
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0)
);
