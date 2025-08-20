const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const app = express();
const PORT = 8080;

// Function: generate PDF & save to backend folder
async function generateDynamicPdf(data, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = await ejs.renderFile(path.join(__dirname, 'template.ejs'), {
    username: data.username,
    amount: data.amount,
    invoiceNo: 'INV-' + Date.now(),
    date: new Date().toLocaleDateString(),
  });

  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Save directly as file
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  return outputPath;
}

app.get('/', (req, res) => {
  res.send(
    'Welcome to the PDF Generator API! Use /generate-pdf to create a PDF.'
  );
});

// Route: generate PDF & save to folder
app.get('/generate-pdf', async (req, res) => {
  try {
    const { username = 'John Doe', amount = '$1000' } = req.query;

    // Ensure reports folder exists
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }

    // Generate unique file name
    const fileName = `report-${Date.now()}.pdf`;
    const outputPath = path.join(reportsDir, fileName);

    // Generate and save PDF
    await generateDynamicPdf({ username, amount }, outputPath);

    // Return file path (or URL if serving as static)
    res.json({ filePath: `/reports/${fileName}` });
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).send('Failed to generate PDF');
  }
});

// Serve reports as static files
app.use('/reports', express.static(path.join(__dirname, 'reports')));

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
