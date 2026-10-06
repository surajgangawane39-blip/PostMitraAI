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
// MARATHI NATURAL WORD CORRECTIONS
// ======================================================

function cleanMarathi(text) {
  if (!text) return text;

  const replacements = {
    "अवसर": "संधी",
    "अवसरे": "संधी",
    "अवसर मिळतात": "संधी मिळतात",
    "अवसर मिळतो": "संधी मिळते",

    "व्यक्तिशी": "व्यक्तीशी",
    "व्यक्ती सोबत": "व्यक्तीसोबत",

    "संपर्ठ": "संपर्क",
    "संपर्ठ साधा": "संपर्क साधा",

    "दृष्टीकोण": "दृष्टीकोन",

    "कौशल्यांचे दर्शन करणे": "तुमची कौशल्यं दाखवणे",
    "कौशल्यांचे दर्शन": "कौशल्यं दाखवणे",

    "उमेदवारीचा आकर्षक": "उमेदवारी अधिक चांगली",
    "प्रोफाईलचा आकर्षक दर्शवा": "तुमचा profile नीट दाखवा",

    "अनुस्मरण करा": "पुन्हा संपर्क करा",
    "अनुस्मरण": "पुन्हा संपर्क",

    "अगोदर्शक": "मार्गदर्शक",

    "अनन्यसाधारण महत्त्व": "खूप महत्त्व",

    "प्रभावी संवादाचे महत्त्व": "चांगल्या संवादाचं महत्त्व",

    "तात्पुरते संपर्क": "वेळोवेळी संपर्क",

    "संधीच्या वेळी संपर्क साधणे": "योग्य वेळी संपर्क करणे",

    "आपल्या कौशल्यांची यादी जोडू शकता": "तुमची skills add करू शकता",

    "आपल्या प्रोफाईलचे आकर्षक": "तुमचा profile चांगला",

    "नोकरी शोधण्याचे सर्वात महत्त्वाचे साधन": "नोकरी शोधताना उपयोगी गोष्ट",

    "आपल्या उमेदवारीचा आकर्षक दर्शवा":
      "तुमची profile आणि skills नीट दाखवा",

    "तुमच्या कौशल्यांचे दर्शन":
      "तुमची skills दाखवणे",

    "नवीन अवसर तयार करा":
      "नवीन संधी तयार करा",

    "नवीन अवसर मिळवा":
      "नवीन संधी मिळवा",

    "एका व्यक्तिशी":
      "एका व्यक्तीशी",

    "इतरांच्या अगोदर जाण्याची संधी":
      "इतरांपेक्षा पुढे जाण्याची संधी",

    "संपर्क राखणे":
      "संपर्कात राहणे"
  };

  let result = text;

  for (const [bad, good] of Object.entries(replacements)) {
    result = result.split(bad).join(good);
  }

  return result;
}


// ======================================================
// MARATHI HUMANIZER
// ======================================================

async function humanizeMarathi(post) {
  const prompt = `
You are PostMitra AI's Marathi Humanizer.

Your job is to rewrite the LinkedIn post below so it sounds like a REAL MARATHI PERSON wrote it.

Keep the original meaning.

Do NOT add facts.

Do NOT invent stories.

Do NOT make it formal.

Do NOT make it sound like a textbook.

Do NOT translate English sentences word-for-word.

The final post should sound natural, simple and conversational.

==================================================
MARATHI STYLE
==================================================

Write in everyday Marathi used by people in Maharashtra.

Marathi-English mixing is allowed when it sounds natural.

Words such as these are completely normal:

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
content
update
job search

Do NOT translate these words unnecessarily.

==================================================
WORDS TO AVOID
==================================================

Never use awkward translated words such as:

अवसर

कौशल्यांचे दर्शन करणे

कौशल्यांचे दर्शन

अनुस्मरण

अगोदर्शक

संपर्ठ

उमेदवारीचा आकर्षक

प्रोफाईलचा आकर्षक दर्शवा

अनन्यसाधारण महत्त्व

प्रभावी संवादाचे महत्त्व

तात्पुरते संपर्क

दृष्टीकोण

==================================================
NATURAL ALTERNATIVES
==================================================

अवसर → संधी

कौशल्यांचे दर्शन करणे → तुमची skills दाखवणे

अनुस्मरण करणे → पुन्हा संपर्क करणे

अगोदर्शक → मार्गदर्शक

संपर्ठ → संपर्क

दृष्टीकोण → दृष्टीकोन

==================================================
WRITING STYLE
==================================================

Write like:

- a young Marathi professional
- a Marathi LinkedIn creator
- a normal educated Marathi speaker

Do NOT write like:

- a textbook
- a government notice
- a translated English article
- an AI-generated essay

Use simple sentences.

Keep paragraphs short.

Do not repeat the same sentence structure.

Do not overuse "आपण", "आपल्या" or "तुम्ही".

Use natural expressions when appropriate:

खरं सांगायचं तर

अनेकदा

कधी कधी

लक्षात येतं

उपयोगी पडतं

करून बघा

पण त्यांचा अतिरेक करू नका.

==================================================
VERY IMPORTANT
==================================================

Before returning the post, read every sentence mentally.

Ask:

"एखादा Marathi creator ही line खरंच LinkedIn वर अशी लिहील का?"

If the answer is NO, rewrite that sentence in simpler Marathi.

Return ONLY the final post.

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
      String(language || "")
        .toLowerCase()
        .includes("marathi");

    const isHindi =
      String(language || "")
        .toLowerCase()
        .includes("hindi");

    let languageRules = "";

    // ==================================================
    // MARATHI
    // ==================================================

    if (isMarathi) {
      languageRules = `
MARATHI MODE

Write in natural everyday Marathi.

Marathi-English mixing is allowed.

Do not translate English words unnecessarily.

Use simple words.

Avoid Sanskrit-heavy vocabulary.

Avoid textbook Marathi.

Avoid government-style Marathi.

The post should sound like a real Marathi LinkedIn creator.

Never use:
अवसर
अनुस्मरण
अगोदर्शक
संपर्ठ
कौशल्यांचे दर्शन
उमेदवारीचा आकर्षक
अनन्यसाधारण
प्रभावी संवादाचे महत्त्व
`;
    }

    // ==================================================
    // HINDI
    // ==================================================

    else if (isHindi) {
      languageRules = `
HINDI MODE

Use natural conversational Indian Hindi.

Hindi-English mixing is allowed.

Avoid textbook Hindi.

Avoid unnecessarily formal Hindi.

Write like a real Indian LinkedIn creator.
`;
    }

    // ==================================================
    // ENGLISH
    // ==================================================

    else {
      languageRules = `
ENGLISH MODE

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
HUMAN WRITING RULES
==================================================

1. Write like a real person.

2. Keep the language simple.

3. Avoid robotic writing.

4. Avoid textbook language.

5. Avoid corporate buzzwords.

6. Avoid generic motivational phrases.

7. Do not invent personal experiences.

8. Do not invent statistics.

9. Do not repeat the same idea.

10. Use short paragraphs.

11. Vary sentence lengths.

12. Make the post useful.

13. Make the post relatable.

14. Do not force a CTA.

15. Use 3-5 relevant hashtags.

==================================================
AVOID THESE AI OPENINGS
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
LINKEDIN STYLE
==================================================

The hook should feel natural.

The body should give genuine value.

Use short paragraphs.

Do not make the post look like an essay.

Do not use unnecessary headings.

The CTA should feel natural.

==================================================
CREATE 5 DIFFERENT POSTS
==================================================

POST 1:
Relatable observation

POST 2:
Practical advice

POST 3:
Story or situation

POST 4:
Opinion

POST 5:
Simple lesson

Make each post genuinely different.

==================================================
OUTPUT FORMAT
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

Do not add any explanation before or after this format.
`;

    // ==================================================
    // FIRST GENERATION
    // ==================================================

    let generatedPost = await callAI(prompt);


    // ==================================================
    // MARATHI HUMANIZATION
    // ==================================================

    if (isMarathi) {
      console.log("MARATHI HUMANIZATION STARTED...");

      generatedPost =
        await humanizeMarathi(generatedPost);

      // Final automatic word correction
      generatedPost =
        cleanMarathi(generatedPost);

      console.log(
        "MARATHI HUMANIZATION COMPLETED."
      );
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

Rewrite this LinkedIn post so it sounds like a real person wrote it.

Keep the original meaning.

Do not add facts.

Do not invent experiences.

Do not make it more formal.

Remove:

- robotic language
- AI-like phrases
- corporate buzzwords
- textbook language
- repetitive sentences
- unnecessary emojis
- generic CTA

If the post is Marathi:

Use everyday Marathi.

Marathi-English mixing is allowed.

Do not translate English words unnecessarily.

Avoid these words:

अवसर
अनुस्मरण
अगोदर्शक
संपर्ठ
कौशल्यांचे दर्शन
उमेदवारीचा आकर्षक
अनन्यसाधारण
प्रभावी संवादाचे महत्त्व
दृष्टीकोण

Prefer:

संधी
पुन्हा संपर्क
मार्गदर्शक
संपर्क
skills दाखवणे
profile नीट दाखवणे
खूप महत्त्व
दृष्टीकोन

Write like a Marathi LinkedIn creator.

Keep paragraphs short.

Keep useful information.

Keep 3-5 hashtags maximum.

Return ONLY the improved post.

ORIGINAL POST:

${post}
`;

    let improvedPost =
      await callAI(prompt);

    improvedPost =
      cleanMarathi(improvedPost);

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
