-- reservations table for Coffee-Shop
CREATE DATABASE IF NOT EXISTS coffee_shop;
USE coffee_shop;

CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  res_id VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) DEFAULT NULL,
  room ENUM('study','function') NOT NULL DEFAULT 'study',
  res_date DATE NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  pax INT NOT NULL DEFAULT 1,
  email VARCHAR(255) NOT NULL,
  equipment TEXT DEFAULT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('Pending','Confirmed','Cancelled') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example row
INSERT INTO reservations (res_id,name,room,res_date,start_time,end_time,pax,email,equipment,total,status)
VALUES ('R#EXAMPLE01','Example','study','2025-11-24','2025-11-24 13:00:00','2025-11-24 15:00:00',4,'test@example.com','["Projector"]',150.00,'Confirmed');
