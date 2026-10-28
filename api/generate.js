export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      topic,
      language,
      tone,
      length,
      audience,
      user_id,
      access_token
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: "Missing required topic"
      });
    }

    const isGuest = !user_id || !access_token || user_id === "guest";

    let generationCount = 0;
    let plan = "free";

    // Supabase login verification
    if (!isGuest) {
      const userResponse = await fetch(
        `${process.env.SUPABASE_URL}/auth/v1/user`,
        {
          headers: {
            "apikey": process.env.SUPABASE_ANON_KEY,
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

      const usageResponse = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/usage?user_id=eq.${encodeURIComponent(
          user_id
        )}&select=generations,plan,period_start`,
        {
          headers: {
            "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );

      if (!usageResponse.ok) {
        const usageError = await usageResponse.text();
        console.error("USAGE ERROR:", usageError);
        throw new Error(`Unable to check usage: ${usageError}`);
      }

      const usageData = await usageResponse.json();
      let usage = usageData?.[0];

      if (!usage) {
        const now = new Date().toISOString();

        const createUsageResponse = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/usage`,
          {
            method: "POST",
            headers: {
              "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
              "Prefer": "return=representation"
            },
            body: JSON.stringify({
              user_id: user_id,
              generations: 0,
              plan: "free",
              period_start: now,
              updated_at: now
            })
          }
        );

        if (!createUsageResponse.ok) {
          const createError = await createUsageResponse.text();
          throw new Error(`Unable to create usage record: ${createError}`);
        }

        const createdUsageData = await createUsageResponse.json();
        usage = createdUsageData?.[0];
      }

      plan = usage?.plan || "free";
      generationCount = usage?.generations || 0;

      const generationLimit = plan === "pro" ? 50 : 5;

      const periodStart = usage?.period_start
        ? new Date(usage.period_start)
        : new Date();

      const now = new Date();

      const monthChanged =
        now.getUTCFullYear() !== periodStart.getUTCFullYear() ||
        now.getUTCMonth() !== periodStart.getUTCMonth();

      if (monthChanged) {
        generationCount = 0;

        await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/usage?user_id=eq.${encodeURIComponent(
            user_id
          )}`,
          {
            method: "PATCH",
            headers: {
              "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              generations: 0,
              period_start: now.toISOString(),
              updated_at: now.toISOString()
            })
          }
        );
      }

      if (generationCount >= generationLimit) {
        return res.status(403).json({
          success: false,
          error:
            plan === "pro"
              ? "You have reached your 50 generations monthly limit."
              : "You have reached your 5 generations monthly limit."
        });
      }
    }

    const prompt = `Create 5 DIFFERENT, high-quality LinkedIn posts on the same topic.

Each post must be a complete standalone LinkedIn post.

Format your response EXACTLY like this:

POST 1
[complete post]
---
POST 2
[complete post]
---
POST 3
[complete post]
---
POST 4
[complete post]
---
POST 5
[complete post]

Requirements:
- Start with a strong hook.
- Give useful or interesting value.
- Use natural LinkedIn-style formatting with short paragraphs.
- Include a clear call-to-action.
- Add 3-5 relevant hashtags.
- Make each post substantially different.
- After all 5 posts, add SCORES.
- Score each post using EXACTLY this format:

SCORES

POST 1: 85/100
HOOK: 17/20
VALUE: 18/20
READABILITY: 16/20
ENGAGEMENT: 17/20
CTA: 17/20

POST 2: 82/100
HOOK: 16/20
VALUE: 17/20
READABILITY: 17/20
ENGAGEMENT: 16/20
CTA: 16/20

POST 3: 88/100
HOOK: 18/20
VALUE: 18/20
READABILITY: 17/20
ENGAGEMENT: 18/20
CTA: 17/20

POST 4: 80/100
HOOK: 16/20
VALUE: 16/20
READABILITY: 16/20
ENGAGEMENT: 16/20
CTA: 16/20

POST 5: 84/100
HOOK: 17/20
VALUE: 17/20
READABILITY: 17/20
ENGAGEMENT: 17/20
CTA: 16/20

BEST POST: POST 3

Topic: ${topic}
Language: ${language || "English"}
Tone: ${tone || "Professional"}
Audience: ${audience || "general LinkedIn audience"}
Post length: ${length || "Medium"}`;

    // Google ne console madhe sangitlela official model (gemini-3.8-flash)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini generation failed");
    }

    const post = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!post) {
      throw new Error("No text received from Gemini API");
    }

    // Increment count if logged in
    if (!isGuest) {
      const newCount = generationCount + 1;

      await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/usage?user_id=eq.${encodeURIComponent(
          user_id
        )}`,
        {
          method: "PATCH",
          headers: {
            "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            generations: newCount,
            updated_at: new Date().toISOString()
          })
        }
      );
    }

    return res.status(200).json({
      success: true,
      post: post
    });

  } catch (error) {
    console.error("GENERATE ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
