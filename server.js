const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const app = express();
const PORT = 8080;
const { pool } = require('./db'); // import your db.js file
const corporateRoutes = require('./routes/corporate.routes'); // import your routes
// Function: generate PDF & save to backend folder
app.use(express.json());

app.use('/api', corporateRoutes);


app.get('/', (req, res) => {
  res.send(
    'Welcome to the home route'
  );
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
