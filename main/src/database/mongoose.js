import mongoose from 'mongoose';
import chalk from 'chalk';

export const connectDatabase = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI is not defined in .env');

        await mongoose.connect(uri);
        console.log(chalk.green('✓ Connected to MongoDB'));
    } catch (error) {
        console.error(chalk.red('✗ MongoDB Connection Error:'), error);
        process.exit(1);
    }
};
