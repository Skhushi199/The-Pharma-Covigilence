require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// ─── Validate required env vars ───────────────────────────────────────────────
if (!process.env.MONGODB_URI) {
  console.error('❌  MONGODB_URI is not set. Please check your .env file.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌  JWT_SECRET is not set. Please check your .env file.');
  process.exit(1);
}

// ─── Mongoose connection options ──────────────────────────────────────────────
const mongooseOptions = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
};

// ─── Connect then start ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI, mongooseOptions)
  .then(() => {
    // Only log that we connected — never log the URI itself
    console.log('✅  MongoDB Atlas connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀  Server is running  →  http://localhost:${PORT}`);
      console.log(`📋  Health check       →  http://localhost:${PORT}/health`);
      console.log(`🌍  Environment        →  ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    // Print only the error message, not the full connection string
    console.error('❌  MongoDB connection failed.');
    console.error('    Reason:', err.message);
    console.error('');
    console.error('    Common causes:');
    console.error('    1. Wrong username or password in MONGODB_URI');
    console.error('    2. Your current IP is not whitelisted in MongoDB Atlas');
    console.error('       → Go to Atlas → Network Access → Add IP Address → Allow from anywhere (0.0.0.0/0)');
    console.error('    3. Cluster name or hostname is incorrect');
    console.error('    4. Network/firewall is blocking outbound port 27017');
    // Do NOT call process.exit — let the error surface without crashing the process abruptly
  });

// ─── Graceful shutdown on SIGINT (Ctrl+C) ────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n🛑  Graceful shutdown initiated...');
  try {
    await mongoose.connection.close();
    console.log('   MongoDB connection closed.');
  } catch (_) {
    // ignore errors during shutdown
  }
  process.exit(0);
});

// ─── Handle uncaught promise rejections ──────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('⚠️   Unhandled Promise Rejection:', reason?.message || reason);
});
