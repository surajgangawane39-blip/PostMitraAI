export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    const auth = Buffer.from(
      process.env.RAZORPAY_KEY_ID +
      ":" +
      process.env.RAZORPAY_KEY_SECRET
    ).toString("base64");

    // ₹49 cha One-Time Order (4900 paise)
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + auth,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: 4900,
        currency: "INR",
        receipt: `pm_${Date.now()}`,
        notes: {
          postmitra_user_id: user_id,
          plan_type: "starter_49"
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.description || "Failed to create Razorpay order");
    }

    return res.status(200).json({
      success: true,
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error("ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
