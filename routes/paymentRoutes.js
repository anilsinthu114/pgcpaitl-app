const express = require("express");
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const adminAuth = require("../middlewares/authMiddleware");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

router.post("/payment/submit", uploadMiddleware.single("screenshot"), paymentController.submitPayment);
router.put("/admin/payment/:id/verify", adminAuth, paymentController.verifyPayment);
router.put("/admin/payment/:id/reject", adminAuth, paymentController.rejectPayment);
router.get("/api/admin/payments/list", adminAuth, paymentController.listPayments);
router.get("/api/payment/screenshot/:id", adminAuth, paymentController.getScreenshot);

module.exports = router;
