const express = require("express");
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const adminAuth = require("../middlewares/authMiddleware");
const appController = require("../controllers/applicationController");

const router = express.Router();

// Public
router.post("/draft", uploadMiddleware.none(), appController.createDraft);
router.get("/api/application/status", appController.checkStatus);
router.get("/api/resolve-id", appController.resolveId);
router.put("/application/:id/submit", appController.submitApplication);

// Admin
router.get("/api/admin/applications", adminAuth, appController.listApplications);
router.get("/application/:id", adminAuth, appController.getApplicationDetails);
router.put("/application/:id/status", adminAuth, appController.updateApplicationStatus);
router.post("/api/admin/application/:id/remind-payment", adminAuth, appController.sendPaymentReminder);
router.post('/admin/application/:id/request-course-fee', adminAuth, appController.requestCourseFee);
router.post('/admin/applications/bulk-mail', adminAuth, appController.sendBulkMail);
router.get("/application/file/:id", adminAuth, appController.downloadFile);

module.exports = router;
