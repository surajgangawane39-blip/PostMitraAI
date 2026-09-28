import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      user_id
    } = req.body;

    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature ||
      !user_id
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing payment details"
      });
    }

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        razorpay_payment_id +
        "|" +
        razorpay_subscription_id
      )
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Payment verification failed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully"
    });

  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
