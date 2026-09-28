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

    const supabaseResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/usage?user_id=eq.${user_id}`,
      {
        method: "PATCH",
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          plan: "pro",
          generations: 0,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      throw new Error(
        "Supabase update failed: " + errorText
      );
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and Pro plan activated"
    });

  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
