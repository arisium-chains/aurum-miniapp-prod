"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const router = (0, express_1.Router)();
// GET /api/status/:jobId - Returns job state
router.get('/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }
        // Get job from queue
        const job = await index_1.faceScoringQueue.getJob(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // Return job status
        res.json({ status: job.getState() });
    }
    catch (error) {
        console.error('Error getting job status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=status.js.map