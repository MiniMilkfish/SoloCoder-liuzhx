require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = path.join(__dirname, process.env.UPLOAD_DIR || './uploads');
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

fs.ensureDirSync(UPLOAD_DIR);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const users = [
  {
    id: '1',
    username: process.env.ADMIN_USERNAME || 'admin',
    password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10)
  }
];

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = users.find(u => u.username === username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Login successful',
    token: token,
    user: {
      id: user.id,
      username: user.username
    }
  });
});

app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileInfo = {
    id: uuidv4(),
    originalName: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size,
    mimeType: req.file.mimetype,
    uploadDate: new Date().toISOString(),
    url: `/api/files/${req.file.filename}`
  };

  res.json({
    message: 'File uploaded successfully',
    file: fileInfo
  });
});

app.get('/api/files', authenticateToken, (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const fileList = files.map(filename => {
      const filePath = path.join(UPLOAD_DIR, filename);
      const stats = fs.statSync(filePath);
      return {
        id: uuidv4(),
        filename: filename,
        size: stats.size,
        uploadDate: stats.birthtime.toISOString(),
        url: `/api/files/${filename}`
      };
    });

    res.json({
      files: fileList.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

app.get('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(filePath);
});

app.delete('/api/files/:filename', authenticateToken, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({
      message: 'File deleted successfully',
      filename: filename
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
});
