export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const auth = Buffer.from(
      process.env.RAZORPAY_KEY_ID +
      ":" +
      process.env.RAZORPAY_KEY_SECRET
    ).toString("base64");

    const response = await fetch(
      "https://api.razorpay.com/v1/subscriptions",
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + auth,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan_id: "plan_Th9P9SJnTunuk1",
          total_count: 12,
          customer_notify: 1
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.description || "Razorpay subscription failed");
    }

    return res.status(200).json({
      success: true,
      subscription_id: data.id
    });

  } catch (error) {
    console.error("RAZORPAY ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
    
