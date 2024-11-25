const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  // Move the SQL query inside the route handler
  const sql = `
    SELECT 
      o.order_id, 
      o.status, 
      GROUP_CONCAT(p.product_name SEPARATOR ', ') AS product_names,
      o.username AS customer_name   
    FROM orders o
    JOIN order_details od ON o.order_id = od.order_id
    JOIN products p ON od.product_id = p.product_id
    GROUP BY o.order_id, o.status, o.username  
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching orders:", err); 
      res.status(500).json({ error: "Failed to retrieve orders" }); 
      return;
    }
    res.render('orders', { orders: result }); 
  });
});


// GET route to render the Add Order form
router.get('/add', (req, res) => {
    res.render('addOrder'); // This assumes you have an EJS file named addOrder.ejs
});

router.post('/add', (req, res) => { 
  const { customer_name, status, orderDetails } = req.body;

  // 1. Start a transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).send('Error placing the order');
    }

    // 2. Insert into 'orders' table with customer_name
    const sqlOrder = `INSERT INTO orders (order_date, status, username) VALUES (NOW(), ?, ?)`;

    db.query(sqlOrder, [status, customer_name], (err, result) => {
      if (err) {
        db.rollback(() => { // Rollback on error
          console.error(err);
          return res.status(500).send('Error placing the order');
        });
        return;
      }

      const orderId = result.insertId;

      // 3. Insert order details
      const sqlOrderDetails = `INSERT INTO Order_Details (order_id, product_id, quantity, price, username) VALUES ?`;
      
      // Prepare values including username for each item
      const values = orderDetails.map(item => [orderId, item.product_id, item.quantity, item.price, customer_name]);

      db.query(sqlOrderDetails, [values], (err, result) => {
        if (err) {
          db.rollback(() => { // Rollback on error
            console.error(err);
            return res.status(500).send('Error adding order details');
          });
          return;
        }

        // 4. Commit transaction if everything is successful
        db.commit((err) => {
          if (err) {
            db.rollback(() => {
              console.error(err);
              return res.status(500).send('Error committing transaction');
            });
            return;
          }

          res.redirect('/orders');
        });
      });
    });
  });
});


// In orders.js (your route file)

// GET route for editing an order
router.get('/edit/:order_id', (req, res) => {
  const orderId = req.params.order_id;
  const query = `SELECT * FROM orders WHERE order_id = ?;`;
  
  db.query(query, [orderId], (err, result) => {
    if (err) {
      console.error('Error fetching order:', err);
      return res.status(500).send('Server Error');
    }
    if (result.length > 0) {
      res.render('editOrder', { order: result[0] }); // Pass order data to the edit form
    } else {
      res.status(404).send('Order not found');
    }
  });
});


router.post('/edit/:order_id', (req, res) => {
  const orderId = req.params.order_id;
  const { username, status } = req.body; // Changed user_id to username

  const query = `
    UPDATE orders
    SET status = ?, username = ?  -- Update the status and username
    WHERE order_id = ?;
  `;
  db.query(query, [status, username, orderId], (err, result) => {
    if (err) {
      console.error('Error updating order:', err);
      return res.status(500).send('Server Error');
    }
    res.redirect('/orders'); // Redirect back to the orders list page
  });
});


router.post('/delete/:order_id', (req, res) => {
  const orderId = req.params.order_id;

  // 1. Start a transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).send('Error deleting order'); 
    }

    // 2. Delete order details
    const deleteOrderDetailsQuery = 'DELETE FROM order_details WHERE order_id = ?';
    db.query(deleteOrderDetailsQuery, [orderId], (err, result) => {
      if (err) {
        db.rollback(() => {
          console.error('Error deleting order details:', err);
          return res.status(500).send('Error deleting order');
        });
        return; 
      }

      // 3. Delete the order
      const deleteOrderQuery = 'DELETE FROM orders WHERE order_id = ?';
      db.query(deleteOrderQuery, [orderId], (err, result) => {
        if (err) {
          db.rollback(() => {
            console.error('Error deleting order:', err);
            return res.status(500).send('Error deleting order');
          });
          return; 
        }

        // 4. Commit the transaction 
        db.commit((err) => {
          if (err) {
            db.rollback(() => {
              console.error('Error committing transaction:', err);
              return res.status(500).send('Error deleting order'); 
            });
            return; 
          }
          res.redirect('/orders');
        });
      });
    }); 
  });
});


router.get('/count', (req, res) => {
  const status = req.query.status; 

  let sql = 'SELECT COUNT(*) AS count FROM orders'; 
  if (status) {
    sql += ' WHERE status = ?'; 
  }

  db.query(sql, [status], (err, result) => {
    if (err) {
      console.error("Error fetching orders count:", err);
      return res.status(500).send('Error fetching orders count');
    }

    res.json({ count: result[0].count }); 
  });
});

// Route to display order logs
router.get('/orderlog', async (req, res) => {
  try {
    const sql = 'SELECT * FROM orderlog ORDER BY timestamp DESC';
    db.query(sql, (err, rows) => {
      if (err) {
        console.error("Error fetching order logs:", err);
        return res.status(500).send('Error fetching order logs from the database.');
      }
      res.render('orderlog', { logs: rows });
    });
  } catch (error) {
    console.error('Error fetching order logs:', error);
    res.status(500).send('Error fetching order logs.');
  }
});


module.exports = router