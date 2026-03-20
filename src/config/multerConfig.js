const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

module.exports = {
    // Configurar onde salvar as imagens
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.resolve(__dirname, '..', '..', 'public', 'uploads', 'produtos'));
        },
        filename: (req, file, cb) => {
            // Gerar nome único para o arquivo
            crypto.randomBytes(16, (err, hash) => {
                if (err) cb(err);
                
                // Pegar extensão original do arquivo
                const ext = path.extname(file.originalname);
                
                // Nome final: hash + timestamp + extensão
                const filename = `${hash.toString('hex')}-${Date.now()}${ext}`;
                cb(null, filename);
            });
        }
    }),
    
    // Limitar tipos de arquivo (apenas imagens)
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
    
    // Limitar tamanho (5MB)
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
};