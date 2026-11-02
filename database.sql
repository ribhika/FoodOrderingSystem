CREATE DATABASE IF NOT EXISTS ribhika_food_ordering;
USE ribhika_food_ordering;

CREATE TABLE IF NOT EXISTS foods (
  food_id INT AUTO_INCREMENT PRIMARY KEY,
  food_name VARCHAR(100) NOT NULL,
  category ENUM('veg', 'non-veg') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  available BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO foods (food_name, category, price, description, available) VALUES
('Paneer Tikka', 'veg', 220.00, 'Grilled paneer with spices', TRUE),
('Chicken Burger', 'non-veg', 180.00, 'Chicken patty burger with fresh toppings', TRUE),
('Veg Fried Rice', 'veg', 160.00, 'Fried rice with mixed vegetables', TRUE);
