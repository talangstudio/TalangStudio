const crypto = require('crypto');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Kangtul05';
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_jwt_default_ganti_ini';

// Simple token generation tanpa library JWT
function generateToken() {
    const payload = {
        admin: true,
        iat: Date.now(),
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 jam
    };
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(payloadStr)
        .digest('hex');
    return `${payloadStr}.${signature}`;
}

function verifyToken(token) {
    if (!token) return false;
    try {
        const [payloadStr, signature] = token.split('.');
        if (!payloadStr || !signature) return false;

        const expectedSig = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(payloadStr)
            .digest('hex');

        if (signature !== expectedSig) return false;

        const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString());
        if (Date.now() > payload.exp) return false;

        return true;
    } catch {
        return false;
    }
}

function checkPassword(password) {
    return password === ADMIN_PASSWORD;
}

function authMiddleware(req, res, next) {
    const token = req.headers['authorization']?.replace('Bearer ', '') ||
                  req.cookies?.admin_token;
    
    if (!verifyToken(token)) {
        return res.status(401).json({ success: false, message: 'Tidak terotorisasi' });
    }
    next();
}

module.exports = { generateToken, verifyToken, checkPassword, authMiddleware };
