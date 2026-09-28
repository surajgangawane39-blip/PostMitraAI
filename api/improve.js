export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      post,
      user_id,
      access_token
    } = req.body;

    if (!post || !user_id || !access_token) {
      return res.status(400).json({
        success: false,
        error: "Missing required data"
      });
    }

    // Verify logged-in Supabase user
    const userResponse = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          "apikey": process.env.SUPABASE_URL
            ? process.env.SUPABASE_ANON_KEY
            : "",
          "Authorization": `Bearer ${access_token}`
        }
      }
    );

    if (!userResponse.ok) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized"
      });
    }

    const authUser = await userResponse.json();

    if (authUser.id !== user_id) {
      return res.status(401).json({
        success: false,
        error: "User verification failed"
      });
    }

    // Check Pro plan from Supabase
    const usageResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/usage?user_id=eq.${encodeURIComponent(user_id)}&select=plan`,
      {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    if (!usageResponse.ok) {
      throw new Error("Unable to check user plan");
    }

    const usageData = await usageResponse.json();
    const plan = usageData?.[0]?.plan || "free";

    if (plan !== "pro") {
      return res.status(403).json({
        success: false,
        error: "Improve Post is a Pro feature"
      });
    }

    const prompt = `Improve this LinkedIn post.

Keep the original meaning and topic.
Make the hook stronger.
Improve readability and LinkedIn formatting.
Make the writing natural and engaging.
Improve the call-to-action.
Keep it concise.
Do not add explanations outside the improved post.
Return only the improved LinkedIn post.

Original post:
${post}`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://post-mitra-ai.vercel.app",
          "X-Title": "PostMitra AI"
        },
        body: JSON.stringify({
          model: "dots-studio/dots-3-note-preview:free",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message ||
        data.error ||
        "OpenRouter request failed"
      );
    }

    const improvedPost =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text;

    if (!improvedPost) {
      throw new Error("No improved post returned from AI");
    }

    return res.status(200).json({
      success: true,
      post: improvedPost
    });

  } catch (error) {
    console.error("IMPROVE ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
