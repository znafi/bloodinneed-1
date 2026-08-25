const mongoose = require('mongoose');

// Serverless invocations reuse a warm container, so the connection (and the
// in-flight promise) is cached on the global object. Without this, every
// concurrent cold start opens its own pool and exhausts the Atlas connection
// limit.
let cached = global.__mongooseCache;

if (!cached) {
    cached = global.__mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not set');
        }

        cached.promise = mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            // A single function instance handles limited concurrency, so a
            // large pool per instance would waste Atlas connections.
            maxPoolSize: 10,
            // Fail fast instead of queueing operations while disconnected.
            bufferCommands: false
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        // Clear the rejected promise so the next request retries.
        cached.promise = null;
        throw err;
    }

    return cached.conn;
};

module.exports = { connectDB, mongoose };
