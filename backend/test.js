require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB Connection...');
console.log('URI provided:', process.env.MONGODB_URI ? 'Yes (hidden for security)' : 'No URI found!');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error Details:');
    console.error(err.message);
    process.exit(1);
  });
