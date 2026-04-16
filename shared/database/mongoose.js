import mongoose from 'mongoose';
import chalk from 'chalk';

export const connectDatabase = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI is not defined in .env');

        // Debug: show masked URI
        const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
        console.log(chalk.cyan(`Connecting to MongoDB: ${maskedUri}`));

        await mongoose.connect(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            family: 4, // Force IPv4 (fixes DNS/SRV issues on Render)
        });
        console.log(chalk.green('✓ Connected to MongoDB'));
    } catch (error) {
        console.error(chalk.red('✗ MongoDB Connection Error:'), error);
        process.exit(1);
    }
};

export const disconnectDatabase = async () => {
    try {
        await mongoose.disconnect();
        console.log(chalk.yellow('Disconnected from MongoDB'));
    } catch (error) {
        console.error(chalk.red('Error disconnecting from MongoDB:'), error);
    }
};
