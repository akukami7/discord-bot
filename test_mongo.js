import mongoose from 'mongoose';

const uri = 'mongodb+srv://angelss:K5ndmQyVTNn4Fwbs@angelsbot.xt5ot4f.mongodb.net/angelss_tickets?appName=angelsbot';

async function testConnection() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        });
        console.log('Connected. Running ping...');
        await mongoose.connection.db.admin().ping();
        console.log('Ping successful! Real connection confirmed.');
        process.exit(0);
    } catch (error) {
        console.error('Connection/ping error:', error);
        process.exit(1);
    }
}

testConnection();
