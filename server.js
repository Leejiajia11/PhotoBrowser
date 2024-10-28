// 引入所需模块
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 创建 Express 应用
const app = express();
const port = 3000;
const Exifr = require('exifr');

// 定义照片上传存储目录
const uploadFolder = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

// 设置 multer 存储文件的方式
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder); // 上传文件保存到 uploads 目录
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // 防止文件名冲突
    }
});

const upload = multer({ storage: storage });

// 解析 POST 请求中的表单数据
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

//顺序显示
app.get('/photos', async (req, res) => {
    const { order } = req.query;
    let photos = await getPhotosFromDatabase();

    // 使用 `captureTime` 字段排序
    photos.sort((a, b) => {
        const dateA = new Date(a.captureTime);
        const dateB = new Date(b.captureTime);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
    });

    res.json(photos);
});

// 照片上传接口
app.post('/upload', upload.single('photo'), (req, res) => {
    const captureTime = req.body.captureTime;
    const captureLocation = req.body.captureLocation;

    if (!req.file || !captureTime || !captureLocation) {
        return res.status(400).json({ error: 'Missing necessary upload information' });
    }

    const newPhoto = {
        id: Date.now(),
        path: `/uploads/${req.file.filename}`,  // 照片存储路径
        captureTime,
        captureLocation
    };
    // 照片上传接口，自动获取EXIF信息
    app.post('/upload', upload.single('photo'), async (req, res) => {
        try {
            const filePath = req.file.path;

            // 使用 exifr 获取 EXIF 数据
            const exifData = await Exifr.parse(filePath);

            // 从 EXIF 数据中提取拍摄时间和位置
            const captureTime = exifData.DateTimeOriginal || req.body.captureTime || ''; // 优先使用 EXIF 时间
            let captureLocation = '';

            if (exifData.latitude && exifData.longitude) {
                captureLocation = `${exifData.latitude},${exifData.longitude}`; // 格式化位置为纬度，经度
            } else {
                captureLocation = req.body.captureLocation; // 如果没有 GPS 信息，则使用用户提供的位置
            }

            // 检查是否存在必要的上传信息
            if (!req.file || !captureTime || !captureLocation) {
                return res.status(400).json({ error: 'Missing necessary upload information' });
            }

            // 生成新照片信息
            const newPhoto = {
                id: Date.now(),
                path: `/uploads/${req.file.filename}`, // 照片存储路径
                captureTime,
                captureLocation
            };

            // 将照片信息存储到文件 (模拟数据库)
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

// 删除照片的路由
app.delete('/upload', (req, res) => {
    const photoPath = req.query.photoPath; // 从查询参数获取照片路径

    if (!photoPath) {
        return res.status(400).json({ message: 'Photo path is required.' });
    }

    // 确保路径是安全的（避免路径穿越攻击）
    const fullPath = path.resolve(uploadFolder, path.basename(photoPath));

    // 调试日志，输出要删除的文件路径
    console.log(`Attempting to delete file: ${fullPath}`);

    fs.unlink(fullPath, (err) => {
        if (err) {
            console.error('Failed to delete photo:', err); // 打印详细错误信息
            return res.status(500).json({ message: 'Failed to delete the photo.', error: err.message });
        }

        res.status(200).json({ message: 'Photo deleted successfully!' });
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`The server is running, access http://localhost:${port}`);
});