# Electronic Shop Inventory Management System

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Database Schema](#database-schema)
- [Installation and Setup](#installation-and-setup)
- [Usage](#usage)
- [Routes](#routes)
- [Environment Variables](#environment-variables)

---

## Project Overview
The **Electronic Shop Inventory Management System** is a web-based application designed to manage products, inventory, and customer orders for an electronic shop. It provides features to streamline inventory management and enhance operational efficiency.

---

## Features
- Add, edit, delete, and view products.
- Track inventory levels and update quantities.
- Create, edit, and delete customer orders.
- View detailed order information with associated products.
- Maintain activity logs for product and order management.
- Search and filter functionality for quick data retrieval.
- Flash messages for real-time user feedback.

---

## Technologies Used
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Templating Engine**: EJS
- **Middleware**:
  - `body-parser`
  - `method-override`
  - `express-session`
  - `connect-flash`
- **Version Control**: Git

---

## Database Schema
The system uses the following tables:
- `Products`: Stores product details (name, category, supplier, price).
- `Categories`: Stores product categories.
- `Suppliers`: Stores supplier details.
- `Inventory`: Tracks quantities of products.
- `Orders`: Stores customer orders and statuses.
- `Order_Details`: Links orders with products, tracking quantities and prices.
- `ProductLog`: Records product-related activities.
- `OrderLog`: Records order-related activities.

---

## Installation and Setup

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- [MySQL](https://www.mysql.com/) database server.

### Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>

2. Install Dependencies:
   npm install
   
3. Configure environment variables: Create a .env file in the root directory with the following:
   PORT=3000
  DB_HOST=your_database_host
  DB_USER=your_database_user
  DB_PASSWORD=your_database_password
  DB_NAME=your_database_name

4. Set up the database: Import the database schema and sample data:
   mysql -u <username> -p <database_name> < schema.sql

5. Start the application:
   node app.js

6. Access the application in your browser:
   http://localhost:3000
