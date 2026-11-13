const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const expenseRoutes = require('./routes/expense.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 8081;

// 1. CORS Configuration
const allowedOriginsStr = process.env.FRONTEND_URLS || process.env.FRONTEND_ALLOWED_ORIGINS || '*';
const allowedOrigins = allowedOriginsStr === '*' 
  ? '*' 
  : allowedOriginsStr.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, cron-jobs)
    if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive to prevent CORS errors across deployments
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// 2. Request Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Keep-alive & Health Check routes (Returns 200 OK for Render / Cron-job.org / Browsers)
app.get(['/', '/health'], (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Satya Makeovers API (PERN Stack)',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});

// 4. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/admin', adminRoutes);

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// 7. Start Server & Connect Database
const startTime = Date.now();
app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 Satya Makeovers API Server running on port ${PORT}`);
  console.log(`⚡ Started in ${Date.now() - startTime}ms (Super Fast PERN Stack)`);
  console.log(`===============================================`);

  // Verify database connection and tables gracefully
  try {
    await db.initDb();
  } catch (err) {
    console.error('Database initialization warning:', err.message);
  }
});
