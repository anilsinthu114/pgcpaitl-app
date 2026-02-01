const crypto = require('crypto');

const prettyId = (id) => `PGCPAITL-2025-${String(id).padStart(4, "0")}`;

// Encryption configuration
const algorithm = 'aes-256-cbc';
// Use a fixed key derived from JWT_SECRET or a dedicated ENCRYPTION_KEY if available
const secretKey = crypto.createHash('sha256').update(String(process.env.JWT_SECRET || 'fallback-secret-key-12345')).digest();
const iv = crypto.createHash('sha256').update(String(process.env.JWT_SECRET || 'fallback-secret-key-12345')).digest().slice(0, 16);

const encrypt = (text) => {
    try {
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    } catch (e) {
        console.error("Encryption failed", e);
        return text;
    }
};

const decrypt = (encryptedText) => {
    try {
        if (!encryptedText || encryptedText.includes('-') || encryptedText.length < 10) return encryptedText; // Likely not encrypted
        const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        // If decryption fails, it might be a plain ID
        return encryptedText;
    }
};

module.exports = { prettyId, encrypt, decrypt };

