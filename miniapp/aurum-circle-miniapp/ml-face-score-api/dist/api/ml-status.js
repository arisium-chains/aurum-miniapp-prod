"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scorer_1 = require("../services/scorer");
const router = (0, express_1.Router)();
// GET /api/ml-status - Returns ML model status
router.get('/', async (req, res) => {
    try {
        const status = await (0, scorer_1.getMLStatus)();
        res.json(status);
    }
    catch (error) {
        console.error('Error getting ML status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=ml-status.js.map