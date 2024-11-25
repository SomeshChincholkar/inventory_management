const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require('express-session');
const flash = require('connect-flash')


// Load environment variables
dotenv.config();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use(flash())

app.get('/', (req, res) => {
    res.render('index'); // Will render views/index.ejs
});

app.use(
    session({
      secret: 'your-secret-key', 
      resave: false,            // Prevents resaving session if unmodified
      saveUninitialized: false, // Doesn't save uninitialized sessions
    })
  );

app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
  });

  

// Routes
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

app.use('/products', productsRouter);
app.use('/orders', ordersRouter);


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
