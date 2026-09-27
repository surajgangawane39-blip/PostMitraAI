require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PostMitra AI backend is running!");
});

app.post("/generate", async (req, res) => {
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

Post length: ${length}

Requirements for every post:
- Start with a strong hook.
- Give useful or interesting value.
- Use natural LinkedIn-style formatting with short paragraphs.
- Include a clear call-to-action.
- Add 3-5 relevant hashtags.
- Make each post substantially different from the others.
- Do not combine the 5 posts into one paragraph.
- Do not add explanations outside the 5 posts.
- After all 5 posts, add a section called SCORES.
- Score each post out of 100 using exactly these 5 categories:
  Hook: 0-20
  Value: 0-20
  Readability: 0-20
  Engagement: 0-20
  CTA: 0-20
- The total score must equal the sum of these 5 category scores.
- Use this exact format:

SCORES
POST 1: XX/100
HOOK: XX/20
VALUE: XX/20
READABILITY: XX/20
ENGAGEMENT: XX/20
CTA: XX/20

POST 2: XX/100
HOOK: XX/20
VALUE: XX/20
READABILITY: XX/20
ENGAGEMENT: XX/20
CTA: XX/20

POST 3: XX/100
HOOK: XX/20
VALUE: XX/20
READABILITY: XX/20
ENGAGEMENT: XX/20
CTA: XX/20

POST 4: XX/100
HOOK: XX/20
VALUE: XX/20
READABILITY: XX/20
ENGAGEMENT: XX/20
CTA: XX/20

POST 5: XX/100
HOOK: XX/20
VALUE: XX/20
READABILITY: XX/20
ENGAGEMENT: XX/20
CTA: XX/20

BEST POST: POST X
Topic: ${topic}
Language: ${language}
Tone: ${tone}
Audience: ${audience || "general LinkedIn audience"}

Requirements:
- Write a useful and engaging LinkedIn post.
- Use natural language.
- Do not mention that you are an AI.
- Do not add explanations outside the post.`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
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
    console.log("OPENROUTER RESPONSE:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

   const post = data.choices?.[0]?.message?.content || data.choices?.[0]?.text;

    if (!post) {
      throw new Error("No post returned from AI");
    }

    res.json({
      success: true,
      post: post
    });

  } catch (error) {
    console.error("OPENROUTER ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
app.post("/improve", async (req, res) => {
  try {
    const { post } = req.body;

    if (!post) {
      throw new Error("No post provided");
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
          "HTTP-Referer": "http://localhost:3000",
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

    const improvedPost =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text;

    if (!improvedPost) {
      throw new Error("No improved post returned from AI");
    }

    res.json({
      success: true,
      post: improvedPost
    });

  } catch (error) {
    console.error("IMPROVE ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
app.listen(3000, () => {
  console.log("PostMitra AI server running on http://localhost:3000");
});