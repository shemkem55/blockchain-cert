// Test database connection
require('dotenv').config();
const { connectDB } = require('./config/db');

async function testConnection() {
    try {
        console.log('🧪 Testing MariaDB connection...\n');
        await connectDB();
        console.log('\n✅ Database connection test successful!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Database connection test failed:', error.message);
        process.exit(1);
    }
}

testConnection();
