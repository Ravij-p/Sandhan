const XLSX = require("xlsx");
const path = require("path");

const generateExcelReport = async (User) => {
  try {
    // Get all courses
    const courses = await User.distinct("course");

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create a summary sheet
    const summaryData = [];
    let totalAmount = 0;
    let totalStudents = 0;

    for (const course of courses) {
      const courseUsers = await User.find({ course, paymentStatus: "paid" });
      const courseAmount = courseUsers.reduce(
        (sum, user) => sum + user.amount,
        0
      );

      summaryData.push({
        Course: course,
        "Total Students": courseUsers.length,
        "Total Amount": courseAmount,
        "Average Amount":
          courseUsers.length > 0
            ? Math.round(courseAmount / courseUsers.length)
            : 0,
      });

      totalAmount += courseAmount;
      totalStudents += courseUsers.length;
    }

    // Add total row
    summaryData.push({
      Course: "TOTAL",
      "Total Students": totalStudents,
      "Total Amount": totalAmount,
      "Average Amount":
        totalStudents > 0 ? Math.round(totalAmount / totalStudents) : 0,
    });

    // Create summary worksheet
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");

    // Create individual course sheets
    for (const course of courses) {
      const courseUsers = await User.find({
        course,
        paymentStatus: "paid",
      }).sort({ paymentDate: -1 });

      const courseData = courseUsers.map((user, index) => ({
        "S.No": index + 1,
        "Receipt No": user.receiptNumber,
        Name: user.name,
        Mobile: user.mobile,
        Course: user.course,
        Amount: user.amount,
        "Payment Date": new Date(user.paymentDate).toLocaleDateString("en-IN"),
        "Payment Time": new Date(user.paymentDate).toLocaleTimeString("en-IN"),
      }));

      // Add course total
      const courseTotal = courseUsers.reduce(
        (sum, user) => sum + user.amount,
        0
      );
      courseData.push({
        "S.No": "",
        "Receipt No": "",
        Name: "",
        Mobile: "",
        Course: "TOTAL",
        Amount: courseTotal,
        "Payment Date": "",
        "Payment Time": "",
      });

      const courseWorksheet = XLSX.utils.json_to_sheet(courseData);

      // Sanitize course name for sheet name (Excel sheet names have restrictions)
      const sheetName = course.replace(/[\\\/\?\*\[\]]/g, "_").substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, courseWorksheet, sheetName);
    }

    return workbook;
  } catch (error) {
    throw error;
  }
};

module.exports = { generateExcelReport };
