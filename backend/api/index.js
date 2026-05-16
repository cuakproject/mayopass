const express = require('express');
const app = express();

app.get('/api', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Export buat Vercel
module.exports = app;