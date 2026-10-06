require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PostMitra AI backend is running!");
});


// ======================================================
// AI HELPER
// ======================================================

async function callAI(prompt) {
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
        model: "google/gemma-4-31b-it:free",
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

  const content =
    data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.text;

  if (!content) {
    throw new Error("No content returned from AI");
  }

  return content;
}


// ======================================================
// MARATHI HUMANIZER
// ======================================================

async function humanizeMarathi(post) {
  const prompt = `
You are a professional Marathi LinkedIn editor.

Your ONLY job is to rewrite the post below into NATURAL, EVERYDAY MARATHI.

Do NOT change the meaning.

Do NOT add new facts.

Do NOT make it more formal.

Do NOT make it sound like an essay.

The final result must sound like a real Marathi-speaking person wrote it on LinkedIn.

IMPORTANT:

Use simple Marathi that people in Maharashtra naturally use.

Marathi-English mixing is allowed and preferred when an English word is commonly used.

Natural words are okay:

LinkedIn
profile
resume
job
career
networking
skills
interview
experience
headline
update
content
job search
opportunity

Do NOT translate these unnecessarily.

--------------------------------------------------
VERY IMPORTANT: REMOVE TRANSLATION-LIKE MARATHI
--------------------------------------------------

NEVER use awkward phrases such as:

"कौशल्यांचे दर्शन करणे"

"नवीन अवसर तयार करणे"

"अवसर"

"अनुस्मरण करणे"

"संपर्ठ"

"अगोदर्शक"

"दृष्टीकोण" when "दृष्टीकोन" or a simpler phrase works

"उमेदवारीचा आकर्षक"

"प्रोफाईलचा आकर्षक दर्शवा"

"अनन्यसाधारण महत्त्व"

"प्रभावी संवादाचे महत्त्व"

"संधीच्या वेळी संपर्क साधणे"

"आपल्या उमेदवारीचा आकर्षक"

"महत्त्वाचे साधन"

when it sounds unnecessarily formal.

If a sentence sounds translated from English, rewrite the entire sentence naturally.

--------------------------------------------------
EXAMPLES
--------------------------------------------------

BAD:

"नेटवर्किंग हे नोकरी शोधण्याचे सर्वात महत्त्वाचे साधन आहे."

NATURAL:

"नोकरी शोधताना फक्त job portals वर depend राहून चालत नाही. योग्य लोकांशी ओळख असणंही तितकंच महत्त्वाचं आहे."

BAD:

"आपल्या कौशल्यांचे दर्शन करणे."

NATURAL:

"तुम्ही काय काम केलंय आणि काय करू शकता, हे लोकांना कळणं."

BAD:

"नवीन अवसर तयार करा."

NATURAL:

"नवीन संधी मिळू शकतात."

BAD:

"आपल्या प्रोफाईलचा आकर्षक दर्शवा."

NATURAL:

"तुमचा LinkedIn profile नीट update करा."

Do NOT copy these examples unless they naturally fit the original post.

--------------------------------------------------
STYLE
--------------------------------------------------

Write like:

a Marathi LinkedIn creator
a young professional
a normal educated Marathi speaker

NOT like:

a textbook
a government notice
a translated article
an AI
a motivational speaker

Use:

"आपल्याला"
"आपण"
"तुम्ही"
"तुमचं"
"आपलं"
"खरं सांगायचं तर"
"अनेकदा"
"कधी कधी"
"लक्षात येतं"
"कामी येतं"
"उपयोगी पडतं"
"करून बघा"

when naturally appropriate.

Do not overuse them.

--------------------------------------------------
SENTENCE STYLE
--------------------------------------------------

Keep sentences short.

Use natural sentence variation.

Do not make every sentence start with:

"आपण"
"आपल्या"
"तुम्ही"

Avoid repetitive structure.

--------------------------------------------------
LINKEDIN STYLE
--------------------------------------------------

Keep short paragraphs.

Keep the original hook if it is good.

If the hook sounds translated, rewrite it naturally.

Keep the useful information.

Keep hashtags.

Maximum 5 hashtags.

Do not add headings.

Do not add explanations.

Return ONLY the final rewritten LinkedIn post.

ORIGINAL POST:

${post}
`;

  return await callAI(prompt);
}


// ======================================================
// GENERATE POSTS
// ======================================================

app.post("/api/generate", async (req, res) => {
  try {
    const {
      topic,
      language,
      tone,
      length,
      audience
    } = req.body;

    if (!topic) {
      throw new Error("Topic is required");
    }

    const isMarathi =
      String(language || "").toLowerCase().includes("marathi");

    const isHindi =
      String(language || "").toLowerCase().includes("hindi");

    let languageRules = "";

    if (isMarathi) {
      languageRules = `
MARATHI:

Write in natural everyday Marathi.

Marathi-English mixing is allowed.

Do not translate English words unnecessarily.

Use words people actually use on LinkedIn.

Avoid Sanskrit-heavy vocabulary.

Avoid textbook Marathi.

Avoid formal government-style Marathi.

The post must sound like a young Marathi professional wrote it.
`;
    }

    else if (isHindi) {
      languageRules = `
HINDI:

Use natural conversational Indian Hindi.

Hindi-English mixing is allowed.

Avoid textbook Hindi.

Avoid unnecessarily formal words.

Write like a real Indian LinkedIn creator.
`;
    }

    else {
      languageRules = `
ENGLISH:

Use natural conversational professional English.

Avoid corporate buzzwords.

Avoid generic AI phrases.

Use simple vocabulary.

Write like a real LinkedIn creator.
`;
    }


    const prompt = `
You are PostMitra AI.

Create LinkedIn posts that sound like real people wrote them.

TOPIC:
${topic}

LANGUAGE:
${language}

TONE:
${tone}

LENGTH:
${length}

AUDIENCE:
${audience || "general LinkedIn audience"}

${languageRules}

==================================================
HUMAN WRITING
==================================================

Do NOT sound like AI.

Do NOT sound like a textbook.

Do NOT sound like a corporate announcement.

Do NOT use generic motivational language.

Do NOT invent personal experiences.

Do NOT invent statistics.

Do NOT repeat the same idea.

Use short paragraphs.

Use natural sentence lengths.

Make the post useful and relatable.

==================================================
AVOID THESE OPENINGS
==================================================

"In today's digital world..."

"In today's fast-paced world..."

"In the ever-evolving landscape..."

"In the modern era..."

"Success is not just about..."

"It is important to understand..."

"Let's dive into..."

"Here are some key insights..."

"Here are some key takeaways..."

"In conclusion..."

==================================================
CTA
==================================================

Use a natural CTA only when appropriate.

Do not automatically write:

"Share your thoughts in the comments below."

==================================================
HASHTAGS
==================================================

Use 3-5 relevant hashtags.

==================================================
CREATE 5 POSTS
==================================================

POST 1:
Relatable observation

POST 2:
Practical advice

POST 3:
Story / situation

POST 4:
Opinion

POST 5:
Simple lesson

Make them genuinely different.

==================================================
OUTPUT
==================================================

Return EXACTLY:

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

Do not add anything before or after this format.
`;

    // First AI generation
    let generatedPost = await callAI(prompt);

    // ==================================================
    // MARATHI ONLY: SECOND HUMANIZATION PASS
    // ==================================================

    if (isMarathi) {
      console.log("MARATHI HUMANIZATION STARTED...");

      generatedPost = await humanizeMarathi(generatedPost);

      console.log("MARATHI HUMANIZATION COMPLETED.");
    }

    res.json({
      success: true,
      post: generatedPost
    });

  } catch (error) {
    console.error("GENERATE ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ======================================================
// IMPROVE / HUMANIZE POST
// ======================================================

app.post("/api/improve", async (req, res) => {
  try {
    const { post } = req.body;

    if (!post) {
      throw new Error("No post provided");
    }

    const prompt = `
You are PostMitra AI's Humanize engine.

Rewrite this LinkedIn post so it sounds like a REAL PERSON wrote it.

Keep the original meaning.

Do not add facts.

Do not make it more formal.

Remove:

- AI-like wording
- robotic phrases
- corporate buzzwords
- textbook language
- repetitive sentences
- unnecessary emojis
- generic CTA

If the post is Marathi:

Use natural everyday Marathi.

Marathi-English mixing is allowed.

Do not translate English words unnecessarily.

Avoid phrases such as:

"कौशल्यांचे दर्शन करणे"

"नवीन अवसर"

"अनुस्मरण करणे"

"संपर्ठ"

"अगोदर्शक"

"उमेदवारीचा आकर्षक"

"प्रोफाईलचा आकर्षक दर्शवा"

"अनन्यसाधारण महत्त्व"

"प्रभावी संवादाचे महत्त्व"

If a sentence sounds translated, rewrite it naturally.

Use common words such as:

profile
resume
job
career
networking
skills
interview
experience
LinkedIn
headline

when appropriate.

The final post should sound like a Marathi creator wrote it naturally.

Keep hashtags.

Maximum 5 hashtags.

Return ONLY the improved post.

ORIGINAL POST:

${post}
`;

    const improvedPost = await callAI(prompt);

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


// ======================================================
// START SERVER
// ======================================================

app.listen(3000, () => {
  console.log(
    "PostMitra AI server running on http://localhost:3000"
  );
});
