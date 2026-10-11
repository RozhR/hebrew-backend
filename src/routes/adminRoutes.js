import express from "express";

import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { getAdminAnalytics } from "../controllers/adminController.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/analytics", getAdminAnalytics);

export default router;
