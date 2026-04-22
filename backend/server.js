// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const httpErrors = require('http-errors');
require('dotenv').config();

const { authRoutes } = require('./routes/auth');
const { userRoutes } = require('./routes/users');
const { campRoutes } = require('./routes/camps');
const { familyRoutes } = require('./routes/families');
const { individualRoutes } = require('./routes/individuals');
const { inventoryRoutes } = require('./routes/inventory');
const { aidRoutes } = require('./routes/aid');
const { reportsRoutes } = require('./routes/reports');
const { permissionRoutes } = require('./routes/permissions');
const { backupSyncRoutes } = require('./routes/backupSync');
const { securityRoutes } = require('./routes/security');
const { softDeleteRoutes } = require('./routes/softDeletes');
const { configRoutes } = require('./routes/config');
const { transferRoutes } = require('./routes/transfers');
const { checkMaintenanceMode } = require('./middleware/maintenance');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: 'draft-7', // Enable RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (req, res) => {
    res.status(429).set('Retry-After', '900').json({
      error: 'Too many requests, please try again later.',
      retryAfter: 900 // seconds
    });
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const { publicRoutes } = require('./routes/public');

// Apply maintenance mode middleware to all API routes
app.use('/api', checkMaintenanceMode);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/individuals', individualRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/aid', aidRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/backup-sync', backupSyncRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/soft-deletes', softDeleteRoutes);
app.use('/api/config', configRoutes);
app.use('/api/transfers', transferRoutes);

// DP-specific routes (for beneficiary portal)
const { dpRoutes } = require('./routes/dp');
app.use('/api/dp', dpRoutes);

// Staff routes (for camp manager to manage complaints, emergency reports, update requests)
const { staffRoutes } = require('./routes/staff');
app.use('/api/staff', staffRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res, next) => {
  console.log(`[404] ${req.method} ${req.originalUrl} - Route not Found`);
  next(httpErrors(404, 'Route not Found'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? (statusCode === 500 ? 'Internal Server Error' : err.message) 
    : err.message;
    
  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`SND Backend API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the existing process or use a different port.`);
    console.error('You can find the process using: lsof -i :' + PORT);
    console.error('Then kill it using: kill -9 <PID>');
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;