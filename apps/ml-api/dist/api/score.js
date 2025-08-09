"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const index_1 = require("../index");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// Multer setup for file uploads (moved here to avoid circular dependency)
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path_1.default.join(__dirname, '../../temp');
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
// POST /api/score - Accepts image and returns jobId
router.post('/', upload.single('image'), async (req, res) => {
    try {
        // Validate input
        if (!req.file && !req.body.image) {
            return res.status(400).json({ error: 'Image is required' });
        }
        // Generate a unique job ID
        const jobId = (0, uuid_1.v4)();
        // Add job to queue
        const job = await index_1.faceScoringQueue.add('faceScoringJob', {
            image: req.file ? req.file.path : req.body.image, // Path or base64
            isBase64: !req.file
        }, {
            jobId
        });
        // Return job ID
        res.status(202).json({ jobId: job.id });
    }
    catch (error) {
        console.error('Error queuing face scoring job:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=score.js.map