const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const User = require("./models/User");
const Payment = require("./models/Payment");
const Otp = require("./models/OTP");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// User Registration
app.post("/register", async (req, res) => {
  const { name, surname, mobile, password } = req.body;
  const username = `${name.slice(0, 3)}${surname.slice(0, 2)}${mobile}`;

  try {
    const existingUser = await User.findOne({ mobile });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const newUser = new User({ name, surname, mobile, username, password });
    await newUser.save();
    res.json({ message: "User registered", username });
  } catch (err) {
    res.status(500).json({ error: "Registration error" });
  }
});

// Send OTP (mock)
const axios = require("axios");

app.post("/send-otp", async (req, res) => {
  const { mobile } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Save OTP
    await Otp.deleteMany({ mobile });
    await new Otp({ mobile, otp }).save();

    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        variables_values: otp,
        route: "otp",
        numbers: mobile,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Sent OTP to ${mobile}: ${otp}`);
    res.json({ message: "OTP sent" });
  } catch (error) {
    console.log("SMS error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { mobile, otp } = req.body;

  const record = await Otp.findOne({ mobile, otp });
  if (!record) return res.status(400).json({ error: "Invalid OTP" });

  await User.updateOne({ mobile }, { $set: { isVerified: true } });
  await Otp.deleteMany({ mobile });

  res.json({ message: "Mobile verified" });
});

// Razorpay Payment
app.post("/create-order", async (req, res) => {
  const { amount } = req.body;
  const options = {
    amount: amount * 100, // INR paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Order creation failed" });
  }
});
app.post("/payment-success", async (req, res) => {
  const { userId, amount, paymentId, receiptUrl } = req.body;
  const payment = new Payment({
    userId,
    amount,
    paymentId,
    receiptUrl,
    status: "success",
  });

  await payment.save();
  res.json({ message: "Payment recorded" });
});

// Get User Payments
app.get("/payments/:userId", async (req, res) => {
  const payments = await Payment.find({ userId: req.params.userId }).sort({
    timestamp: -1,
  });
  res.json(payments);
});
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
