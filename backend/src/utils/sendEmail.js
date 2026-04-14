import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify Your Email - Merit Nook",
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Email Verification</h2>
        <p>Your verification OTP is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset Your Password - Merit Nook",
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Your password reset OTP is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

export const sendPaymentReceiptEmail = async (email, payment) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Payment Successful - Merit Nook",
    html: `
      <h2>Payment Successful</h2>
      <p>Invoice Number: ${payment.invoiceNumber}</p>
      <p>Amount: ₹${payment.amount}</p>
      <p>Thank you for your payment.</p>
    `,
  });
};

export const sendAssignmentSubmissionEmail = async ({
  teacherEmail,
  teacherName,
  studentName,
  assignmentTitle,
  note,
  isLate,
  fileBuffer,
  fileName,
  fileMime,
}) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: teacherEmail,
    subject: `📝 Assignment Submission${isLate ? ' (Late)' : ''} — ${assignmentTitle} by ${studentName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#7c5cfc;margin-bottom:4px;">New Assignment Submission</h2>
        <p style="color:#6b7280;margin-top:0;">Merit Nook</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <table style="width:100%;font-size:14px;color:#374151;border-collapse:collapse;">
          <tr><td style="padding:6px 0;font-weight:600;width:140px;">Assignment</td><td>${assignmentTitle}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;">Student</td><td>${studentName}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;">Status</td><td style="color:${isLate ? '#ef4444' : '#10b981'};">${isLate ? '⚠️ Late submission' : '✅ On time'}</td></tr>
          ${note ? `<tr><td style="padding:6px 0;font-weight:600;vertical-align:top;">Note</td><td>${note}</td></tr>` : ''}
        </table>
        <p style="font-size:13px;color:#6b7280;margin-top:20px;">The submitted file is attached to this email.</p>
      </div>
    `,
    attachments: fileBuffer ? [
      {
        filename: fileName,
        content: fileBuffer,
        contentType: fileMime,
      },
    ] : [],
  });
};