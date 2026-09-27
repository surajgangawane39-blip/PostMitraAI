export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { topic, language, tone, length, audience } = req.body;

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
- Score each post out of 100:
  Hook: 0-20
  Value: 0-20
  Readability: 0-20
  Engagement: 0-20
  CTA: 0-20
- Total must equal the five category scores.
- Identify BEST POST: POST X

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
      throw new Error(JSON.stringify(data));
    }

    const post =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text;

    if (!post) {
      throw new Error("No post returned from AI");
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
