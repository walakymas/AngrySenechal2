// Serves the built Angular app (dist/AngrySenechal2).
//
// Environment:
//   PORT            listening port (default 8080)
//   DIST_DIR        folder of the built app (default dist/AngrySenechal2; the tests use a temporary one)
//   REQUIRE_HTTPS   'false' turns the redirect to https off (default: on)
//   TRUST_PROXY     number of reverse proxies in front of the app (default 1: Heroku / one proxy), or an
//                   Express "trust proxy" value; X-Forwarded-Proto is only believed for trusted proxies
//   ALLOWED_HOSTS   comma separated host names the https redirect may use; if unset any plain host name is
//                   accepted (no path, user info or spaces), anything else gets a 400
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');

const DIST = process.env.DIST_DIR || path.join(__dirname, 'dist', 'AngrySenechal2');
const HASHED_ASSET = /\.[0-9a-f]{16,}\.(js|css)$/;  // Angular production build: content hash in the file name
const HOST_PATTERN = /^[a-z0-9.-]+(:\d{1,5})?$/;
const allowedHosts = (process.env.ALLOWED_HOSTS || '').split(',').map(h => h.trim().toLowerCase()).filter(Boolean);

function trustProxy() {
    const value = process.env.TRUST_PROXY;
    if (value === undefined || value === '') {
        return 1;
    }
    return isNaN(value) ? value : Number(value);
}

function requireHTTPS(req, res, next) {
    if (process.env.REQUIRE_HTTPS === 'false' || req.secure) {
        return next();
    }
    // never redirect to a host taken blindly from the request
    const host = (req.get('host') || '').toLowerCase();
    const allowed = allowedHosts.length
        ? allowedHosts.includes(host) || allowedHosts.includes(host.replace(/:\d+$/, ''))
        : HOST_PATTERN.test(host);
    if (!allowed) {
        return res.status(400).send('Bad host');
    }
    res.redirect(301, 'https://' + host + req.originalUrl);
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', trustProxy());

app.use(requireHTTPS);
app.use(helmet({
    // Report-only for now: the page loads Google fonts / icons, map images from any host and calls an API on
    // another origin, and Angular's production build inlines critical CSS. Check the browser console for
    // violations, then switch `reportOnly` off to enforce it.
    contentSecurityPolicy: {
        reportOnly: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'https:', 'http:'],
            connectSrc: ["'self'", 'https:', 'http:'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: null,
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use(compression());

app.use(express.static(DIST, {
    index: false,
    setHeaders: (res, file) => {
        // hashed bundles never change; everything else (index.html, assets) is revalidated
        res.setHeader('Cache-Control', HASHED_ASSET.test(file)
            ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
}));

app.get('*', (req, res) => {
    // a missing file (e.g. an old hashed bundle) is a 404, not the app shell with status 200
    if (path.extname(req.path)) {
        return res.status(404).send('Not found');
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(DIST, 'index.html'));
});

if (require.main === module) {
    app.listen(process.env.PORT || 8080);
}

module.exports = app;
