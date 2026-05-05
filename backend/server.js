const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ✅ CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://task-flow-nine-beige.vercel.app'
  ],
  credentials: true
}));

app.use(express.json());

// ✅ ROOT ROUTE (VERY IMPORTANT FOR RAILWAY)
app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// ✅ HEALTH CHECK (FIXED PATH)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ✅ API ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

// ✅ ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

// ✅ CONNECT DB + START SERVER
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');

    const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });