-- Create database
CREATE DATABASE wecaredb;

-- Connect to database
\c wecaredb;

-- Create tables
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  avatar VARCHAR(255),
  bio TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  user_id INTEGER REFERENCES users(id),
  receiver_id INTEGER REFERENCES users(id),
  status VARCHAR(20) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donation_images (
  id SERIAL PRIMARY KEY,
  donation_id INTEGER REFERENCES donations(id),
  image_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  donation_id INTEGER REFERENCES donations(id),
  reviewer_id INTEGER REFERENCES users(id),
  reviewee_id INTEGER REFERENCES users(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, icon) VALUES
('Clothing', 'shirt-outline'),
('Food', 'fast-food-outline'),
('Furniture', 'bed-outline'),
('Electronics', 'laptop-outline'),
('Books', 'book-outline'),
('Toys', 'game-controller-outline'),
('Medical', 'medical-outline'),
('Other', 'cube-outline');

-- Insert admin user
INSERT INTO users (name, email, phone, password, role)
VALUES (
  'Admin', 
  'admin@wecaredonations.com', 
  '1234567890', 
  -- Password: admin123 (hashed)
  '$2b$10$X9oLvFH.bEJ8xMGQpW3NXeKB1xRQJhZxhH1hPVIm.QCl3jtEFQXcq', 
  'admin'
);
