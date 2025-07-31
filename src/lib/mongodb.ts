import mongoose from 'mongoose';

const MONGODB_URI = import.meta.env.VITE_MONGODB_URI || 'mongodb+srv://sajidhussain9430:Sajid943031@cluster0.s8oiuzg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Don't initialize mongoose in the browser
if (isBrowser) {
  throw new Error('MongoDB should only be accessed from server-side code');
}

// For Node.js environment
let cached = (global as any).mongoose;

if (!cached) {
  (global as any).mongoose = { conn: null, promise: null };
  cached = (global as any).mongoose;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;