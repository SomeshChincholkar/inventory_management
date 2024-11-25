DELIMITER $$

CREATE TRIGGER after_product_insert
AFTER INSERT ON Products
FOR EACH ROW
BEGIN
    INSERT INTO ProductLog (product_id, product_name, action, timestamp)
    VALUES (NEW.product_id, NEW.product_name, 'Inserted', NOW());
END$$

DELIMITER ;



DELIMITER $$

CREATE TRIGGER after_product_delete
AFTER DELETE ON Products
FOR EACH ROW
BEGIN
    INSERT INTO ProductLog (product_id, product_name, action, timestamp)
    VALUES (OLD.product_id, OLD.product_name, 'Deleted', NOW());
END$$

DELIMITER ;


DELIMITER $$

CREATE TRIGGER after_order_insert
AFTER INSERT ON Orders
FOR EACH ROW
BEGIN
    INSERT INTO OrderLog (order_id, username, action, timestamp)
    VALUES (NEW.order_id, NEW.username, 'Inserted', NOW());
END$$

DELIMITER ;


DELIMITER $$

CREATE TRIGGER after_order_delete
AFTER DELETE ON Orders
FOR EACH ROW
BEGIN
    INSERT INTO OrderLog (order_id, username, action, timestamp)
    VALUES (OLD.order_id, OLD.username, 'Deleted', NOW());
END$$

DELIMITER ;


// Curosor

DELIMITER $$

CREATE PROCEDURE GenerateInventoryReport()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE prod_id INT;
    DECLARE prod_name VARCHAR(100);
    DECLARE prod_price DECIMAL(10,2);
    DECLARE prod_category VARCHAR(50);
    DECLARE supplier_name VARCHAR(100);
    DECLARE inv_quantity INT;
    DECLARE inv_last_updated TIMESTAMP;

    -- Declare the cursor for selecting from the joined tables
    DECLARE inventory_cursor CURSOR FOR 
        SELECT 
            p.product_id, 
            p.product_name, 
            p.price, 
            c.category_name, 
            s.supplier_name, 
            i.quantity, 
            i.last_updated 
        FROM 
            products p
        JOIN 
            inventory i ON p.product_id = i.product_id
        JOIN 
            categories c ON p.category_id = c.category_id
        JOIN 
            suppliers s ON p.supplier_id = s.supplier_id;

    -- Declare the NOT FOUND handler to exit the loop
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Open the cursor
    OPEN inventory_cursor;

    -- Start fetching the records
    read_loop: LOOP
        FETCH inventory_cursor INTO prod_id, prod_name, prod_price, prod_category, supplier_name, inv_quantity, inv_last_updated;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Here, you can process each record
        -- For example, you can print it or insert it into another table
        SELECT CONCAT(
            'Product ID: ', prod_id, 
            ', Product Name: ', prod_name, 
            ', Price: ', prod_price, 
            ', Category: ', prod_category, 
            ', Supplier: ', supplier_name, 
            ', Quantity: ', inv_quantity, 
            ', Last Updated: ', inv_last_updated) AS report;

    END LOOP;

    -- Close the cursor
    CLOSE inventory_cursor;
END$$

DELIMITER ;