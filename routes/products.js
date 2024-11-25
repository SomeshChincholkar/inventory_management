const express = require('express');
const router = express.Router();
const db = require('../db/database');
const flash = require('connect-flash');

router.use(flash());

// READ all Products (Render Products List)
router.get('/', (req, res) => {
  const sql = `
    SELECT p.product_id, p.product_name, p.price, c.category_name, s.supplier_name, i.quantity
    FROM Products p
    JOIN Categories c ON p.category_id = c.category_id
    JOIN Suppliers s ON p.supplier_id = s.supplier_id
    JOIN Inventory i ON p.product_id = i.product_id
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching products:", err);
      return res.status(500).send('Error fetching products from the database.');
    }
    res.render('products', { products: result, page: 'products' });
  });
});


// READ form for adding a new product
router.get('/add', (req, res) => {
  const sqlCategories = `SELECT * FROM Categories`;
  const sqlSuppliers = `SELECT * FROM Suppliers`;

  db.query(sqlCategories, (err, categories) => {
    if (err) { 
      console.error("Error fetching categories:", err);
      return res.status(500).send('Error fetching categories from the database.');
    };
    db.query(sqlSuppliers, (err, suppliers) => {
      if (err) { 
        console.error("Error fetching suppliers:", err);
        return res.status(500).send('Error fetching suppliers from the database.');
      };
      res.render('addProduct', { categories, suppliers, page: 'products' }); 
    });
  });
});


// CREATE Product (Handle form submission)
router.post('/add', (req, res) => {
  const { product_name, category_id, supplier_id, price, quantity } = req.body;

  // First insert the product into the Products table
  const sqlProduct = `INSERT INTO Products (product_name, category_id, supplier_id, price) 
                      VALUES (?, ?, ?, ?)`;
  
  db.query(sqlProduct, [product_name, category_id, supplier_id, price], (err, result) => {
    if (err) {
      console.error("Error adding product:", err);
      return res.status(500).send('Error adding product to the database.');
    }
    
    const productId = result.insertId; // Get the ID of the newly inserted product
    
    // Then insert the quantity into the Inventory table
    const sqlInventory = `INSERT INTO Inventory (product_id, quantity) VALUES (?, ?)`;
    
    db.query(sqlInventory, [productId, quantity], (err, result) => {
      if (err) {
        console.error("Error adding inventory:", err);
        return res.status(500).send('Error adding inventory to the database.');
      }

      // Redirect back to the products list page after successful insert
      req.flash('success', 'Product added successfully');
      res.redirect('/products');
    });
  });
});


// READ form for editing a product
router.get('/edit/:id', (req, res) => {
  const sqlProduct = `SELECT p.*, i.quantity FROM Products p 
                      JOIN Inventory i ON p.product_id = i.product_id
                      WHERE p.product_id = ?`;
  const sqlCategories = `SELECT * FROM Categories`;
  const sqlSuppliers = `SELECT * FROM Suppliers`;

  db.query(sqlProduct, [req.params.id], (err, productResult) => {
    if (err) {
      console.error("Error fetching product:", err);
      return res.status(500).send('Error fetching product from the database.'); 
    }

    if (productResult.length === 0) { 
      return res.status(404).send('Product not found'); 
    }

    db.query(sqlCategories, (err, categoryResult) => {
      if (err) {
        console.error("Error fetching categories:", err);
        return res.status(500).send('Error fetching categories from the database.');
      }

      db.query(sqlSuppliers, (err, supplierResult) => {
        if (err) {
          console.error("Error fetching suppliers:", err);
          return res.status(500).send('Error fetching suppliers from the database.');
        }

        res.render('editProduct', { 
          product: productResult[0], 
          categories: categoryResult,
          suppliers: supplierResult,
          page: 'products'
        });
      });
    });
  });
});


/// UPDATE Product (Handle form submission)
router.post('/edit/:id', (req, res) => {
  const { product_name, category_id, supplier_id, price, quantity } = req.body;
  const productId = req.params.id;

  // First, update the product details
  const sqlUpdateProduct = `
    UPDATE Products 
    SET product_name = ?, category_id = ?, supplier_id = ?, price = ? 
    WHERE product_id = ?`;

  db.query(sqlUpdateProduct, [product_name, category_id, supplier_id, price, productId], (err, result) => {
    if (err) {
      console.error("Error updating product:", err);
      return res.status(500).send('Error updating product in the database.');
    }

    // Then, update the product quantity in the Inventory table
    const sqlUpdateInventory = `UPDATE Inventory SET quantity = ? WHERE product_id = ?`;
    db.query(sqlUpdateInventory, [quantity, productId], (err, result) => {
      if (err) {
        console.error("Error updating inventory:", err);
        return res.status(500).send('Error updating inventory in the database.');
      }

      // Redirect to the products list page
      req.flash('success', 'Product updated successfully.');
      res.redirect('/products');
    });
  });
});


// DELETE Product (and corresponding inventory)
router.post('/delete/:id', (req, res) => {
  const productId = req.params.id;

  // Delete from Inventory first to maintain referential integrity
  const sqlDeleteInventory = `DELETE FROM Inventory WHERE product_id = ?`;

  db.query(sqlDeleteInventory, [productId], (err, result) => {
    if (err) {
      console.error("Error deleting inventory:", err);
      return res.status(500).send('Error deleting inventory from the database.');
    }

    // Then delete the product from Products table
    const sqlDeleteProduct = `DELETE FROM Products WHERE product_id = ?`;
    db.query(sqlDeleteProduct, [productId], (err, result) => {
      if (err) {
        console.error("Error deleting product:", err);
        return res.status(500).send('Error deleting product from the database.');
      }

      // Redirect to products list after successful deletion
      req.flash('success', 'Product deleted successfully.');
      res.redirect('/products');
    });
  });
});


router.get('/count', (req, res) => {
  const sql = 'SELECT COUNT(*) AS count FROM products'; // Replace 'products' with your actual table name

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching products count:", err);
      return res.status(500).send('Error fetching products count');
    }

    res.json({ count: result[0].count }); // Send the count as JSON
  });
});

router.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q + '%';
    const [rows] = await pool.execute(
      `SELECT p.product_id, p.product_name, c.category_name, s.supplier_name, p.price, i.quantity
       FROM products p
       JOIN categories c ON p.category_id = c.category_id
       JOIN suppliers s ON p.supplier_id = s.supplier_id
       JOIN inventory i ON p.product_id = i.product_id
       WHERE p.product_name LIKE ?`, // Selecting all product data
      [searchTerm]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/productlog', (req, res) => {
  db.query('SELECT * FROM productlog ORDER BY timestamp DESC', (err, rows) => {
    if (err) {
      console.error("Error fetching product logs:", err);
      return res.status(500).send('Error fetching product logs.');
    }
    console.log("Fetched logs:", rows);
    res.render('productlog', { logs: rows });
  });
});


module.exports = router;