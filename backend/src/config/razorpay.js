import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const isRazorpayConfigured = Boolean(
  keyId &&
    keySecret &&
    !keyId.includes("xxxxx") &&
    keyId !== "rzp_test_xxxxx"
);

const razorpay = isRazorpayConfigured
  ? new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  : null;

export { isRazorpayConfigured };

export default razorpay;