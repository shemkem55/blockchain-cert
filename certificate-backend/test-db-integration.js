// Test SQLite database connection
require('dotenv').config();
const { connectDB } = require('./config/db-sqlite');
const { User } = require('./config/models-sqlite');

async function testDatabase() {
    try {
        console.log('🧪 Testing SQLite Database Integration...\n');

        // Connect to database
        await connectDB();
        console.log('\n✅ Database connection successful!');

        // Test user count
        const userCount = await User.countDocuments();
        console.log(`\n📊 Total users in database: ${userCount}`);

        // Check for admin
        const admin = await User.findOne({ email: 'admin@test.com' });
        if (admin) {
            console.log(`\n👤 Admin user exists: ${admin.email}`);
            console.log(`   Role: ${admin.role}`);
            console.log(`   Verified: ${admin.isVerified}`);
        }

        console.log('\n✅ All database tests passed!');
        console.log('\n🚀 Ready to start the server with: node server.js');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Database test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testDatabase();
