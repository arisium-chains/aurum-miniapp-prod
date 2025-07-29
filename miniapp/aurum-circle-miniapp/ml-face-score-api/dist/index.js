"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.faceScoringQueue = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const score_1 = __importDefault(require("./api/score"));
const status_1 = __importDefault(require("./api/status"));
const result_1 = __importDefault(require("./api/result"));
const ml_status_1 = __importDefault(require("./api/ml-status"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new ioredis_1.default(redisUrl);
// Create queue
exports.faceScoringQueue = new bullmq_1.Queue('faceScoring', { connection: redis });
// Middleware
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '2mb' }));
// Multer setup for file uploads (we'll keep this for potential future use, but it's not exported)
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path_1.default.join(__dirname, '../temp');
        if (!fs_1.default.existsSync(tempDir)) {
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${(0, uuid_1.v4)()}-${file.originalname}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    }
});
// Routes
app.use('/api/score', score_1.default);
app.use('/api/status', status_1.default);
app.use('/api/result', result_1.default);
app.use('/api/ml-status', ml_status_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.listen(port, () => {
    console.log(`Face scoring API listening on port ${port}`);
});
// Auto-cleanup processed temp files every 24h
setInterval(() => {
    const tempDir = path_1.default.join(__dirname, '../temp');
    if (fs_1.default.existsSync(tempDir)) {
        const files = fs_1.default.readdirSync(tempDir);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        files.forEach(file => {
            const filePath = path_1.default.join(tempDir, file);
            const stat = fs_1.default.statSync(filePath);
            if (stat.mtime.getTime() < oneDayAgo) {
                fs_1.default.unlinkSync(filePath);
                console.log(`Cleaned up old temp file: ${file}`);
            }
        });
    }
}, 24 * 60 * 60 * 1000); // Every 24 hours
exports.default = app;
//# sourceMappingURL=index.js.map