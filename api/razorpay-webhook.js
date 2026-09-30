import crypto from "crypto";

export const config = {
  api: {
    bodyParser: false
  }
};

async function getRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function getSubscription(subscriptionId) {
  const auth = Buffer.from(
    process.env.RAZORPAY_KEY_ID +
    ":" +
    process.env.RAZORPAY_KEY_SECRET
  ).toString("base64");

  const response = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${subscriptionId}`,
    {
      headers: {
        "Authorization": "Basic " + auth
      }
    }
  );

  if (!response.ok) {
    throw new Error("Unable to fetch Razorpay subscription");
  }

  return await response.json();
}

async function updateUsage(userId, plan, generations) {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/usage?user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        plan,
        generations,
        period_start: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Supabase update failed: " + errorText);
  }
}
async function saveReferral(referralCode, userId) {
  if (!referralCode) return;

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/referrals`,
    {
      method: "POST",
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        referral_code: referralCode,
        user_id: userId,
        status: "paid"
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Referral save failed: " + errorText);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const rawBody = await getRawBody(req);

    const webhookSignature =
      req.headers["x-razorpay-signature"];

    if (!webhookSignature) {
      return res.status(400).json({
        success: false,
        error: "Missing webhook signature"
      });
    }

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET
      )
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      return res.status(400).json({
        success: false,
        error: "Invalid webhook signature"
      });
    }

    const event = JSON.parse(rawBody);

    console.log("RAZORPAY WEBHOOK EVENT:", event.event);

    let subscription = null;

    if (
      event.event === "payment.failed"
    ) {
      const subscriptionId =
        event.payload?.payment?.entity?.subscription_id;

      if (subscriptionId) {
        subscription = await getSubscription(subscriptionId);
      }
    } else {
      subscription =
        event.payload?.subscription?.entity;
    }

    const userId =
      subscription?.notes?.postmitra_user_id;

    if (!userId) {
      console.error("PostMitra user ID not found");
      return res.status(200).json({
        success: true,
        received: true
      });
    }

    if (
      event.event === "subscription.charged"
    ) {
      await updateUsage(userId, "pro", 0);
    }

    if (
      event.event === "subscription.cancelled" ||
      event.event === "subscription.halted" ||
      event.event === "subscription.completed"
    ) {
      await updateUsage(userId, "free", 0);
    }

    if (
      event.event === "payment.failed"
    ) {
      console.log(
        "Payment failed for user:",
        userId
      );
    }

    return res.status(200).json({
      success: true,
      received: true
    });

  } catch (error) {
    console.error("WEBHOOK ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
