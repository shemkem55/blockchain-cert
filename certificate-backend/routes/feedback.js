const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { Feedback } = require("../config/models");

router.post(
    "/",
    [
        body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
        body("email").isEmail().withMessage("Valid email is required"),
        body("subject").trim().isLength({ min: 1 }).withMessage("Subject is required"),
        body("feedbackType").isIn(["general", "bug", "feature", "improvement", "other"]).withMessage("Invalid feedback type"),
        body("message").trim().isLength({ min: 10 }).withMessage("Message must be at least 10 characters"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, email, subject, feedbackType, message } = req.body;

            const feedback = new Feedback({
                name,
                email,
                subject,
                feedbackType,
                message,
            });

            await feedback.save();

            res.json({ message: "✅ Thank you for your feedback! We appreciate your input." });
        } catch (error) {
            console.error("❌ FEEDBACK error:", error);
            const showDetail = process.env.NODE_ENV !== "production";
            res.status(500).json({ error: showDetail ? error.message : "Internal server error" });
        }
    }
);

module.exports = router;
