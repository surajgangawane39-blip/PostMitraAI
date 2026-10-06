```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PostMitra AI backend is running!");
});


// ===============================
// GENERATE POSTS
// ===============================
app.post("/generate", async (req, res) => {
  try {
    const { topic, language, tone, length, audience } = req.body;

    const prompt = `
You are PostMitra AI — a human-style LinkedIn content writer.

Your biggest priority is this:

THE CONTENT MUST SOUND LIKE A REAL PERSON WROTE IT.

Do NOT make the writing sound like generic AI-generated content.

LANGUAGE:
${language}

TONE:
${tone}

AUDIENCE:
${audience || "general LinkedIn audience"}

TOPIC:
${topic}

POST LENGTH:
${length}


===============================
HUMAN WRITING RULES
===============================

1. Write like a real person talking to another person.

2. Avoid robotic, corporate and overly polished language.

3. Avoid generic AI openings such as:
- "In today's digital world..."
- "In today's fast-paced world..."
- "In the ever-evolving landscape..."
- "In the modern era..."
- "Success is not just about..."
- "In conclusion..."
- "It is important to understand that..."
- "Let's dive into..."
- "Here are some key insights..."

4. Do not unnecessarily use complicated vocabulary.

5. Prefer short and natural sentences.

6. Sentence lengths should naturally vary.

7. Do not make every paragraph follow the same pattern.

8. Do not force motivational language.

9. Do not sound like a textbook, essay, advertisement or corporate press release.

10. Avoid excessive emojis. Use them only when they genuinely fit the tone.

11. Do not use fake personal experiences or invent facts.

12. Do not repeat the same idea using different words.

13. Make the reader feel that a real creator/professional wrote the post.

14. The hook should feel interesting and natural, NOT clickbait.

15. The post should provide an actual thought, observation, lesson, experience, opinion or useful insight.

16. CTA should feel conversational.
Do NOT use generic CTAs such as:
"Share your thoughts in the comments below."
unless it genuinely fits the post.

17. Hashtags should be relevant and limited to 3-5.

18. Do not use unnecessary headings such as:
"Introduction"
"Key Takeaways"
"Conclusion"
unless they naturally fit the content.


===============================
SPECIAL MARATHI RULES
===============================

If the language is Marathi:

- Write in natural everyday Marathi.
- Prefer conversational Marathi over textbook Marathi.
- Marathi-English mixing is allowed when it sounds natural.
- Do not translate English phrases word-for-word into unnatural Marathi.
- Avoid extremely formal Marathi.
- Avoid difficult Sanskrit-heavy vocabulary.
- Write the way a Marathi creator would naturally write on LinkedIn.
- Use simple words that normal Marathi-speaking professionals understand.
- The post should feel local, relatable and human.
- Do not make every sentence grammatically "perfect" if that makes it sound unnatural.
- Natural conversational expressions are allowed when appropriate.

Example of BAD style:
"आजच्या डिजिटल युगामध्ये प्रभावी संवादाचे अनन्यसाधारण महत्त्व आहे."

Better style:
"आपण कितीही चांगलं काम करत असलो, पण ते लोकांपर्यंत पोहोचत नसेल तर त्याचा उपयोग काय?"

Do NOT copy this example. Use it only to understand the desired writing style.


===============================
SPECIAL HINDI RULES
===============================

If the language is Hindi:

- Use natural conversational Hindi.
- Avoid overly formal Hindi.
- Normal Hindi-English mixing is allowed when natural.
- Avoid textbook-style sentences.
- Write like a real Indian creator/professional.


===============================
SPECIAL ENGLISH RULES
===============================

If the language is English:

- Use natural conversational professional English.
- Avoid corporate buzzwords.
- Avoid unnecessarily sophisticated vocabulary.
- Sound confident but human.
- Use contractions when appropriate.
- Do not make every sentence perfectly structured like an AI essay.


===============================
CONTENT REQUIREMENTS
===============================

Create 5 DIFFERENT LinkedIn posts on the same topic.

Each post must:

- Be a complete standalone LinkedIn post.
- Have a strong but natural hook.
- Give genuine value.
- Be easy to read.
- Use short paragraphs.
- Have a natural flow.
- Feel different from the other 4 posts.
- Include a relevant conversational CTA.
- Include 3-5 relevant hashtags.

The 5 posts should use DIFFERENT approaches.

For example:
Post 1 = personal observation
Post 2 = practical advice
Post 3 = storytelling
Post 4 = strong opinion
Post 5 = relatable lesson

Do not force these formats if they don't fit the topic.


===============================
OUTPUT FORMAT
===============================

Return EXACTLY this structure:

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

---

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

IMPORTANT:
Do not add any explanation before or after this format.
Do not mention that you are an AI.
`;

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

    console.log(
      "OPENROUTER RESPONSE:",
      JSON.stringify(data, null, 2)
    );

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    const post =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text;

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


// ===============================
// IMPROVE / HUMANIZE POST
// ===============================
app.post("/improve", async (req, res) => {
  try {
    const { post } = req.body;

    if (!post) {
      throw new Error("No post provided");
    }

    const prompt = `
You are PostMitra AI's Humanize & Improve engine.

Rewrite the LinkedIn post below so that it sounds like a REAL HUMAN wrote it.

IMPORTANT:
Keep the original meaning, topic and important information.

Your goal is NOT to make it sound more "professional".

Your goal is to make it sound:
- natural
- relatable
- conversational
- clear
- confident
- human

REMOVE:
- robotic AI phrases
- generic motivational language
- corporate buzzwords
- unnecessary formal language
- repetitive sentences
- unnecessary headings
- fake enthusiasm
- forced emojis
- generic CTA language

AVOID phrases like:
"In today's digital world..."
"In today's fast-paced world..."
"In the ever-evolving landscape..."
"Success is not just about..."
"It is important to understand..."
"Let's dive into..."
"Here are some key takeaways..."

MARATHI:
If the original post is Marathi, use simple everyday Marathi.
Marathi-English mixing is allowed when natural.
Avoid textbook Marathi and Sanskrit-heavy words.
Write like a real Marathi creator would speak/write.

HINDI:
If the original post is Hindi, use conversational Indian Hindi.
Normal Hindi-English mixing is allowed when natural.

ENGLISH:
If the original post is English, use natural conversational professional English.
Avoid corporate buzzwords and unnecessarily sophisticated vocabulary.

HOOK:
Make the opening interesting without making it clickbait.

BODY:
Keep the useful information.
Improve flow and readability.
Use short paragraphs.
Vary sentence lengths naturally.

CTA:
Make the CTA conversational.
Do not automatically use "What do you think? Share your thoughts in the comments below."

HASHTAGS:
Keep relevant hashtags if they exist.
Use 3-5 maximum.

Return ONLY the improved post.
Do not explain what you changed.
Do not mention AI.

ORIGINAL POST:
${post}
`;

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


// ===============================
// START SERVER
// ===============================
app.listen(3000, () => {
  console.log(
    "PostMitra AI server running on http://localhost:3000"
  );
});
```
