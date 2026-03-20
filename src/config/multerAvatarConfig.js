const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Garantir que a pasta existe
const avatarDir = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

module.exports = {
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, avatarDir);
        },
        filename: (req, file, cb) => {
            // Nome único: avatar-USERID-TIMESTAMP.ext
            const ext = path.extname(file.originalname);
            const filename = `avatar-${req.session.user.id}-${Date.now()}${ext}`;
            cb(null, filename);
        }
    }),
    
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo inválido. Apenas imagens são permitidas.'));
        }
    },
    
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    }
};