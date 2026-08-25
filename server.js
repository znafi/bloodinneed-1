const path = require('path');

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { connectDB, mongoose } = require('./lib/db');
const donorRoutes = require('./routes/donors');

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = Number(process.env.PORT) || 10000;
const ON_VERCEL = Boolean(process.env.VERCEL);

// Comma separated allowlist. Unset means same-origin only, which is all the
// bundled React client needs.
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const app = express();

// Vercel terminates TLS at the edge, so req.ip is only trustworthy once we opt
// in to the forwarded headers. The rate limiter depends on this being correct.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(compression());

app.use(
    helmet({
        // Static assets are served from the CDN and get their headers from
        // vercel.json; this policy covers API responses.
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
                imgSrc: ["'self'", 'data:'],
                connectSrc: ["'self'"],
                frameAncestors: ["'none'"],
                objectSrc: ["'none'"]
            }
        },
        hsts: NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
        crossOriginEmbedderPolicy: false
    })
);

app.use(express.json({ limit: '10kb' }));

// In-memory counters are per function instance rather than global, so these are
// a speed bump against casual abuse, not a hard guarantee. A shared store
// (Redis) would be required for strict enforcement.
app.use(
    '/api/',
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests. Please try again later.' }
    })
);

// Registrations are far more abusable than reads, so they get a tighter budget.
app.use(
    '/api/donors',
    rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.method !== 'POST',
        message: { error: 'Too many registrations from this address. Please try again later.' }
    })
);

app.get('/api/health', async (req, res) => {
    res.set('Cache-Control', 'no-store');

    let database = 'disconnected';
    try {
        await connectDB();
        database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch (err) {
        database = 'error';
    }

    res.json({ status: 'ok', environment: NODE_ENV, database });
});

if (CORS_ORIGINS.length > 0) {
    app.use(
        cors({
            origin: CORS_ORIGINS,
            credentials: true,
            optionsSuccessStatus: 200
        })
    );
}

// Establish (or reuse) the database connection before any donor route runs.
app.use('/api/donors', async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('Database connection failed:', err.message);
        res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
    }
});

app.use('/api/donors', donorRoutes);

// Unmatched API routes must not fall through to the SPA, otherwise clients
// receive HTML where they expect JSON.
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// On Vercel the client is served from the CDN out of public/ and express.static
// is ignored, so this only applies when running the server directly.
if (!ON_VERCEL) {
    const buildPath = path.join(__dirname, 'public');

    app.use(
        express.static(buildPath, {
            setHeaders: (res, filePath) => {
                if (filePath.includes(`${path.sep}static${path.sep}`)) {
                    res.set('Cache-Control', 'public, max-age=31536000, immutable');
                } else {
                    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
                }
            }
        })
    );

    app.get('*', (req, res, next) => {
        res.set('Cache-Control', 'no-cache');
        res.sendFile(path.join(buildPath, 'index.html'), (err) => {
            if (err) next(err);
        });
    });
}

// Express renders its own 500 page otherwise, which can leave the function in an
// undefined state on Vercel.
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    // Body parser and similar middleware attach a status for malformed or
    // oversized requests; those are client errors, not server faults.
    const status = err.status || err.statusCode || 500;

    if (status >= 500) {
        console.error('Unhandled error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(status).json({ error: err.expose ? err.message : 'Bad request' });
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
});

// Vercel imports this module and drives the app itself. The listener is only for
// running the server directly (local development or any long-lived host).
if (require.main === module) {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server listening on port ${PORT} in ${NODE_ENV} mode`);
        connectDB()
            .then(() => console.log('Connected to MongoDB'))
            .catch((err) => console.error('MongoDB connection failed:', err.message));
    });

    const shutdown = (signal) => {
        console.log(`${signal} received, shutting down`);
        server.close(() => {
            mongoose.connection.close(false).finally(() => process.exit(0));
        });

        setTimeout(() => {
            console.error('Forcing shutdown after timeout');
            process.exit(1);
        }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
