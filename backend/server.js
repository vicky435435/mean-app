require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectMongoDB = require('./config/db');
const { connectMySQL, initializeMySQL } = require('./config/mysql');

// Route imports
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const weatherRoutes = require('./routes/weather');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin:  true, 
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Database Connections ─────────────────────────────────────────────────────
connectMongoDB();
connectMySQL().then(() => initializeMySQL());

// ─── Routes 
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/weather', weatherRoutes);

// ─── Health Check 
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MEAN Stack API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler 
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});


app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});


app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
