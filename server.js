// ��������ģ��
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ���� Express Ӧ��
const app = express();
const port = 3000;
const Exifr = require('exifr');

// ������Ƭ�ϴ��洢Ŀ¼
const uploadFolder = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

// ���� multer �洢�ļ��ķ�ʽ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder); // �ϴ��ļ����浽 uploads Ŀ¼
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // ��ֹ�ļ�����ͻ
    }
});

const upload = multer({ storage: storage });

// ���� POST �����еı�����
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// �ṩ��̬�ļ�����
app.use(express.static(path.join(__dirname, 'public')));

//˳����ʾ
app.get('/photos', async (req, res) => {
    const { order } = req.query;
    let photos = await getPhotosFromDatabase();

    // ʹ�� `captureTime` �ֶ�����
    photos.sort((a, b) => {
        const dateA = new Date(a.captureTime);
        const dateB = new Date(b.captureTime);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
    });

    res.json(photos);
});

// ��Ƭ�ϴ��ӿ�
app.post('/upload', upload.single('photo'), (req, res) => {
    const captureTime = req.body.captureTime;
    const captureLocation = req.body.captureLocation;

    if (!req.file || !captureTime || !captureLocation) {
        return res.status(400).json({ error: 'Missing necessary upload information' });
    }

    const newPhoto = {
        id: Date.now(),
        path: `/uploads/${req.file.filename}`,  // ��Ƭ�洢·��
        captureTime,
        captureLocation
    };
    // ��Ƭ�ϴ��ӿڣ��Զ���ȡEXIF��Ϣ
    app.post('/upload', upload.single('photo'), async (req, res) => {
        try {
            const filePath = req.file.path;

            // ʹ�� exifr ��ȡ EXIF ����
            const exifData = await Exifr.parse(filePath);

            // �� EXIF ��������ȡ����ʱ���λ��
            const captureTime = exifData.DateTimeOriginal || req.body.captureTime || ''; // ����ʹ�� EXIF ʱ��
            let captureLocation = '';

            if (exifData.latitude && exifData.longitude) {
                captureLocation = `${exifData.latitude},${exifData.longitude}`; // ��ʽ��λ��Ϊγ�ȣ�����
            } else {
                captureLocation = req.body.captureLocation; // ���û�� GPS ��Ϣ����ʹ���û��ṩ��λ��
            }

            // ����Ƿ���ڱ�Ҫ���ϴ���Ϣ
            if (!req.file || !captureTime || !captureLocation) {
                return res.status(400).json({ error: 'Missing necessary upload information' });
            }

            // ��������Ƭ��Ϣ
            const newPhoto = {
                id: Date.now(),
                path: `/uploads/${req.file.filename}`, // ��Ƭ�洢·��
                captureTime,
                captureLocation
            };

            // ����Ƭ��Ϣ�洢���ļ� (ģ�����ݿ�)
            const dataFile = path.join(__dirname, 'photos.json');
            let photos = [];
            if (fs.existsSync(dataFile)) {
                photos = JSON.parse(fs.readFileSync(dataFile));
            }
            photos.push(newPhoto);
            fs.writeFileSync(dataFile, JSON.stringify(photos, null, 2));
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(200).json({ message: 'Photo upload successful', photo: newPhoto });
        } catch (error) {
            console.error('Failed to retrieve EXIF information:', error);
            res.status(500).json({ error: 'Failed to retrieve EXIF information' });
        }
    });
});

// ɾ����Ƭ��·��
app.delete('/upload', (req, res) => {
    const photoPath = req.query.photoPath; // �Ӳ�ѯ������ȡ��Ƭ·��

    if (!photoPath) {
        return res.status(400).json({ message: 'Photo path is required.' });
    }

    // ȷ��·���ǰ�ȫ�ģ�����·����Խ������
    const fullPath = path.resolve(uploadFolder, path.basename(photoPath));

    // ������־�����Ҫɾ�����ļ�·��
    console.log(`Attempting to delete file: ${fullPath}`);

    fs.unlink(fullPath, (err) => {
        if (err) {
            console.error('Failed to delete photo:', err); // ��ӡ��ϸ������Ϣ
            return res.status(500).json({ message: 'Failed to delete the photo.', error: err.message });
        }

        res.status(200).json({ message: 'Photo deleted successfully!' });
    });
});

// ����������
app.listen(port, () => {
    console.log(`The server is running, access http://localhost:${port}`);
});