const { v4: uuidv4 } = require('uuid');

function generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    function randomSegment(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    const prefix = 'RBX';
    const seg1 = randomSegment(4);
    const seg2 = randomSegment(4);
    const seg3 = randomSegment(4);
    const seg4 = randomSegment(4);

    return `${prefix}-${seg1}-${seg2}-${seg3}-${seg4}`;
}

function generateId() {
    return uuidv4();
}

function generateApiSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sk_live_';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = { generateKey, generateId, generateApiSecret };
