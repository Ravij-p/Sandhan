const PDFDocument = require("pdfkit");

function generateReceiptToStream(data, outputStream) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(outputStream);

  const PRIMARY = "#353841";
  const SECONDARY = "#C8B8A9";
  const ACCENT = "#fcfcfc";
  const pageWidth = doc.page.width - 100; // account for margins

  // ── Header band ──────────────────────────────────────────────────────────
  doc.rect(50, 40, pageWidth, 70).fill(PRIMARY);
  doc
    .fontSize(26)
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .text("TUSHTI IAS", 50, 55, { align: "center", width: pageWidth });
  doc
    .fontSize(11)
    .fillColor(SECONDARY)
    .font("Helvetica")
    .text("Payment Receipt", 50, 85, { align: "center", width: pageWidth });

  // ── Receipt meta row ─────────────────────────────────────────────────────
  const metaY = 130;
  doc.rect(50, metaY, pageWidth, 32).fill(ACCENT);
  doc
    .fontSize(10)
    .fillColor(PRIMARY)
    .font("Helvetica-Bold")
    .text(`Receipt No: ${data.receiptNumber}`, 60, metaY + 10);
  doc
    .fontSize(10)
    .fillColor(PRIMARY)
    .font("Helvetica")
    .text(
      `Date: ${new Date(data.paymentDate || Date.now()).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`,
      50,
      metaY + 10,
      { align: "right", width: pageWidth }
    );

  // ── Student details ───────────────────────────────────────────────────────
  let y = metaY + 52;
  doc
    .fontSize(12)
    .fillColor(PRIMARY)
    .font("Helvetica-Bold")
    .text("Student Details", 50, y);
  y += 18;
  doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor(SECONDARY).lineWidth(1).stroke();
  y += 12;

  const field = (label, value) => {
    doc.fontSize(10).fillColor("#555").font("Helvetica-Bold").text(label, 50, y, { width: 130 });
    doc.fontSize(10).fillColor("#222").font("Helvetica").text(value || "—", 185, y);
    y += 20;
  };

  field("Name:", data.name);
  field("Email:", data.email);
  field("Mobile:", data.mobile);
  
  // Always show password if available
  if (data.password) {
    y += 5;
    doc.fontSize(11).fillColor("#d32f2f").font("Helvetica-Bold")
      .text("LOGIN CREDENTIALS", 50, y);
    y += 20;
    doc.fontSize(10).fillColor("#555").font("Helvetica-Bold").text("Password:", 50, y, { width: 130 });
    doc.fontSize(12).fillColor("#d32f2f").font("Helvetica-Bold")
      .text(data.password, 185, y);
    y += 25;
    doc.fontSize(8).fillColor("#d32f2f").font("Helvetica-Bold")
      .text("⚠ IMPORTANT: Keep this password safe! Use it to login at the website.", 50, y, { width: pageWidth - 100 });
    y += 18;
  }

  y += 8;
  // ── Payment details ───────────────────────────────────────────────────────
  doc
    .fontSize(12)
    .fillColor(PRIMARY)
    .font("Helvetica-Bold")
    .text("Payment Details", 50, y);
  y += 18;
  doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor(SECONDARY).lineWidth(1).stroke();
  y += 12;

  field("Course:", data.courseName);
  field("Razorpay Order ID:", data.razorpayOrderId || "—");
  field("Razorpay Payment ID:", data.razorpayPaymentId || "—");

  y += 8;
  // ── Price breakdown box ───────────────────────────────────────────────────
  const boxH = 100;
  doc.rect(50, y, pageWidth, boxH).fill("#f9f9f8").stroke(ACCENT);
  doc
    .fontSize(11)
    .fillColor(PRIMARY)
    .font("Helvetica-Bold")
    .text("Price Breakdown", 60, y + 10);

  const col1 = 60, col2 = 50 + pageWidth - 100;
  let by = y + 28;

  const lineItem = (label, amount, bold = false) => {
    doc
      .fontSize(10)
      .fillColor("#444")
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .text(label, col1, by);
    doc
      .fontSize(10)
      .fillColor(bold ? PRIMARY : "#444")
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .text(`₹${Number(amount).toLocaleString("en-IN")}`, col2, by, { width: 80, align: "right" });
    by += 18;
  };

  lineItem("Course Price", data.baseAmount);
  lineItem("Razorpay Charges (2% + 18% GST)", data.gatewayCharge);
  doc
    .moveTo(col1, by - 4)
    .lineTo(50 + pageWidth - 10, by - 4)
    .strokeColor(SECONDARY)
    .lineWidth(0.5)
    .stroke();
  lineItem("Grand Total Paid", data.totalAmount, true);

  y += boxH + 14;

  // ── Status badge ──────────────────────────────────────────────────────────
  doc.rect(50, y, pageWidth, 30).fill("#e6f4ea");
  doc
    .fontSize(12)
    .fillColor("#2d6a4f")
    .font("Helvetica-Bold")
    .text("✓  Payment Status: SUCCESSFUL", 50, y + 8, { align: "center", width: pageWidth });

  y += 46;
  // ── Footer ────────────────────────────────────────────────────────────────
  doc
    .fontSize(9)
    .fillColor("#888")
    .font("Helvetica")
    .text(
      "This is a computer-generated receipt and does not require a signature.\nFor support, contact Tushti IAS.",
      50,
      y,
      { align: "center", width: pageWidth }
    );

  doc.end();
}

module.exports = { generateReceiptToStream };
