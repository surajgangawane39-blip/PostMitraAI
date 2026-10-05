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

    if (!topic || !user_id || !access_token) {
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

    // Get usage + plan
    const usageResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/usage?user_id=eq.${encodeURIComponent(user_id)}&select=generations,plan,period_start`,
      {
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    if (!usageResponse.ok) {
      throw new Error("Unable to check usage");
    }

    const usageData = await usageResponse.json();
    const usage = usageData?.[0];

    if (!usage) {
      return res.status(403).json({
        success: false,
        error: "Usage record not found"
      });
    }

    const plan = usage.plan || "free";
    let generationCount = usage.generation || 0;

    const generationLimit = plan === "pro" ? 50 : 5;

    // Monthly reset
    const periodStart = usage.period_start
      ? new Date(usage.period_start)
      : new Date();

    const now = new Date();

    const monthChanged =
      now.getUTCFullYear() !== periodStart.getUTCFullYear() ||
      now.getUTCMonth() !== periodStart.getUTCMonth();

    if (monthChanged) {
      generationCount = 0;

      const resetResponse = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/usage?user_id=eq.${encodeURIComponent(user_id)}`,
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

      if (!resetResponse.ok) {
        throw new Error("Unable to reset monthly usage");
      }
    }

    // Check generation limit
    if (generationCount >= generationLimit) {
      return res.status(403).json({
        success: false,
        error:
          plan === "pro"
            ? "You have reached your 50 generations monthly limit."
            : "You have reached your 5 generations monthly limit."
      });
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

IMPORTANT:
- Use exactly the labels HOOK, VALUE, READABILITY, ENGAGEMENT, CTA.
- Use exactly the format NUMBER/20 for every category.
- Total score must equal the sum of the five category scores.
- Do not use Markdown tables for scores.
- Do not add any extra text between SCORES and BEST POST.
Topic: ${topic}
Language: ${language}
Tone: ${tone}
Audience: ${audience || "general LinkedIn audience"}
Post length: ${length}

Do not mention that you are an AI.
Do not add explanations outside the posts and scores.`;

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

    const post =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text;

    if (!post) {
      throw new Error("No post returned from AI");
    }

    // Count this generation
    const newCount = generationCount + 1;

    const updateResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/usage?user_id=eq.${encodeURIComponent(user_id)}`,
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

    if (!updateResponse.ok) {
      throw new Error("Unable to update usage");
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
