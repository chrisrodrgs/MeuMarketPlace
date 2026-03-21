const multer = require('multer');
const path = require('path');
const fs = require('fs');

const bannerDir = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'banners');
if (!fs.existsSync(bannerDir)) {
    fs.mkdirSync(bannerDir, { recursive: true });
}

module.exports = {
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, bannerDir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const filename = `banner-${Date.now()}${ext}`;
            cb(null, filename);
        }
    }),
    
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo inválido. Apenas imagens são permitidas.'));
        }
    },
    
    limits: { fileSize: 5 * 1024 * 1024 }
};