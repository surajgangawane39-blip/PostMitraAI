export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const Razorpay = require("razorpay");

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: "plan_Th9P9SJnTunuk1",
      total_count: 12,
      customer_notify: 1
    });

    return res.status(200).json({
      success: true,
      subscription_id: subscription.id
    });

  } catch (error) {
    console.error("RAZORPAY ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
