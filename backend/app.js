const express = require("express");

require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

connectDB();

// Razorpay Instance
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_SECRET,
// });
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
// User Registration
// app.post("/register", async (req, res) => {
//   const { name, surname, mobile, password } = req.body;
//   const username = `${name.slice(0, 3)}${surname.slice(0, 2)}${mobile}`;

//   try {
//     const existingUser = await User.findOne({ mobile });
//     if (existingUser)
//       return res.status(400).json({ error: "User already exists" });

//     const newUser = new User({ name, surname, mobile, username, password });
//     await newUser.save();
//     res.json({ message: "User registered", username });
//   } catch (err) {
//     res.status(500).json({ error: "Registration error" });
//   }
// });

// Send OTP (mock)
const User = require("./models/User");
const cors = require("cors");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5000;

connectDB();
app.use(cors());
app.use(express.json());

// POST /api/users — Save user details
app.post("/api/users", async (req, res) => {
  const { name, mobile, course } = req.body;
  console.log("Received user:", req.body);
  try {
    const user = new User({ name, mobile, course });
    await user.save();

    res.status(201).json({ message: "User saved successfully" });
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res
        .status(400)
        .json({ error: "This mobile number is already registered." });
    }

    res.status(500).json({ error: "Server Error" });
  }
});

app.get("/api/export/:course", async (req, res) => {
  const { course } = req.params;
  try {
    const users = await User.find({ course });

    const data = users.map((u) => ({
      Name: u.name,
      Mobile: u.mobile,
      Course: u.course,
      RegisteredAt: u.createdAt.toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    const filePath = path.join(__dirname, `${course}-users.xlsx`);
    XLSX.writeFile(workbook, filePath);

    res.download(filePath, `${course}-users.xlsx`, () => {
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export users" });
  }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
