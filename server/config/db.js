import mongoose from 'mongoose';

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Environment variable MONGO_URI is used to determine target database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_db');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Optional: Process exit can be enabled depending on hosting strategy
    // process.exit(1);
  }
};

export default connectDB;
