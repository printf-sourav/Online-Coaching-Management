import PDFDocument from "pdfkit";

export const generateInvoicePDF = (payment, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${payment.invoiceNumber}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(20).text("EduNova Invoice", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Invoice Number: ${payment.invoiceNumber}`);
  doc.text(`Payment ID: ${payment.razorpayPaymentId}`);
  doc.text(`Amount: ₹${payment.amount}`);
  doc.text(`Status: ${payment.status}`);
  doc.text(`Paid At: ${payment.paidAt}`);

  doc.end();
};