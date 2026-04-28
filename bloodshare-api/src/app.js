const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Route de test
app.get('/health', (req, res) => {
  res.json({ status: 'OK', project: 'BloodShare API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BloodShare API running on port ${PORT}`);
});