const express = require("express");
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const adminAuth = require("../middlewares/authMiddleware");
const appController = require("../controllers/applicationController");

const router = express.Router();

// Public
router.post("/draft", uploadMiddleware.none(), appController.createDraft);
router.post(
    "/api/application/upload-documents",
    uploadMiddleware.fields([
        { name: "photo", maxCount: 1 },
        { name: "id_proof", maxCount: 1 },
        { name: "degree", maxCount: 1 },
        { name: "marks", maxCount: 1 },
        { name: "other", maxCount: 5 },
    ]),
    appController.uploadDocuments
);
router.get("/api/application/status", appController.checkStatusProV2);
router.get("/api/resolve-id", appController.resolveId);
router.put("/application/:id/submit", appController.submitApplication);

// Admin
router.get("/api/admin/applications", adminAuth, appController.listApplications);
router.get("/application/:id", adminAuth, appController.getApplicationDetails);
router.put("/application/:id/status", adminAuth, appController.updateApplicationStatus);
router.post("/api/admin/application/:id/remind-payment", adminAuth, appController.sendPaymentReminder);
router.post('/api/admin/application/:id/request-course-fee', adminAuth, appController.requestCourseFee);
router.post('/admin/applications/bulk-mail', adminAuth, appController.sendBulkMail);
router.get("/application/file/:id", adminAuth, appController.downloadFile);

module.exports = router;
