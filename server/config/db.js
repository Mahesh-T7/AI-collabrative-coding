import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.warn('⚠️  MongoDB is not available. Server will run with limited functionality.');
        console.warn('⚠️  To enable full features, please install and start MongoDB.');
        // Don't exit - allow server to run without database
    }
};

export default connectDB;
