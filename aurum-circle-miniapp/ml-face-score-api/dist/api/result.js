"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const router = (0, express_1.Router)();
// GET /api/result/:jobId - Returns result
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
        // Check if job is completed
        const state = await job.getState();
        if (state !== 'completed') {
            return res.status(400).json({
                error: 'Job not completed yet',
                status: state
            });
        }
        // Return result
        res.json(job.returnvalue);
    }
    catch (error) {
        console.error('Error getting job result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=result.js.map