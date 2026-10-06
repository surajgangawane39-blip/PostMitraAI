require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PostMitra AI backend is running!");
});

async function callAI(prompt) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
        ],
        temperature: 0.8
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

  return content.trim();
}


/* =====================================================
   MARATHI CLEANUP
===================================================== */

function cleanMarathi(text) {
  if (!text) return text;

  const replacements = [
    ["अविभाज्य भाग", "महत्त्वाचा भाग"],
    ["अविभाज्य", "महत्त्वाचा"],
    ["अधिकृत नोकरीच्या संधी", "नोकरीच्या संधी"],
    ["अधिकृत संधी", "नोकरीच्या संधी"],
    ["नोकरीच्या अधिकृत संधी", "नोकरीच्या संधी"],

    ["नोकरीचा आमंत्रण", "नोकरीची संधी"],
    ["नोकरीचे आमंत्रण", "नोकरीची संधी"],
    ["नोकरीच्या आमंत्रण", "नोकरीची संधी"],
    ["आमंत्रण मिळू शकतो", "संधी मिळू शकते"],

    ["उद्योजकतेचा आणि विश्वासाचा वापर", "आपलं काम आणि अनुभव नीट सांगणं"],

    ["नेटवर्किंग स्ट्रॅटेजी", "networking plan"],
    ["नेटवर्किंग आपल्याला", "Networking मुळे"],
    ["नेटवर्किंग म्हणजे", "Networking म्हणजे"],

    ["तुमच्या संपर्कांचं महत्त्व", "तुमच्या contacts चं महत्त्व"],
    ["संपर्कांचं महत्त्व", "contacts चं महत्त्व"],
    ["संपर्कांच्या माध्यमातून", "contacts मधून"],
    ["संपर्कांच्या माध्यमातून तुम्ही", "contacts मधून तुम्ही"],

    ["संधी शोधण्यास मदत करते", "संधी शोधायला मदत करते"],
    ["संधी शोधण्यास मदत करते", "संधी शोधायला मदत करते"],
    ["संधी शोधू शकता", "संधी शोधायला मदत होऊ शकते"],

    ["संधी दाखवू शकते", "नवीन opportunities मिळवून देऊ शकते"],
    ["बाहेर असलेल्या संधी", "नवीन opportunities"],

    ["एका वेळी एका संपर्काने", "एखाद्या contact मुळे"],
    ["एका संपर्काने", "एखाद्या contact मुळे"],

    ["व्यक्तिचं", "व्यक्तीचं"],
    ["व्यक्तिशी", "व्यक्तीशी"],
    ["एका व्यक्तीने", "एखाद्या व्यक्तीने"],

    ["तुमच्या अनुभवाचा लेख किंवा संपर्क साधा", "तुमचा experience share करा किंवा एखाद्या व्यक्तीशी connect व्हा"],
    ["तुमच्या अनुभवाचा लेख", "तुमचा experience share करा"],
    ["अनुभवाचा लेख", "experience share"],

    ["कौशल्यांचे दर्शन करणे", "तुमची skills दाखवणे"],
    ["कौशल्यांचे दर्शन", "तुमची skills दाखवणे"],
    ["तुमच्या कौशल्यांचे दर्शन", "तुमची skills दाखवणे"],

    ["प्रोफाईलचा आकर्षक दर्शवा", "तुमचा profile नीट दाखवा"],
    ["आपल्या प्रोफाईलचे आकर्षक", "तुमचा profile चांगला"],
    ["आपल्या उमेदवारीचा आकर्षक दर्शवा", "तुमची profile आणि skills नीट दाखवा"],

    ["अनुस्मरण करा", "पुन्हा संपर्क करा"],
    ["अनुस्मरण", "पुन्हा संपर्क"],

    ["अगोदर्शक", "मार्गदर्शक"],
    ["अनन्यसाधारण महत्त्व", "खूप महत्त्व"],
    ["प्रभावी संवादाचे महत्त्व", "चांगल्या संवादाचं महत्त्व"],

    ["तात्पुरते संपर्क", "वेळोवेळी संपर्क"],
    ["संधीच्या वेळी संपर्क साधणे", "योग्य वेळी संपर्क करणे"],

    ["दृष्टीकोण", "दृष्टीकोन"],
    ["संपर्ठ", "संपर्क"],
    ["संपर्क राखणे", "संपर्कात राहणे"],

    ["आपल्या कौशल्यांची यादी जोडू शकता", "तुमची skills add करू शकता"],

    ["नोकरी शोधण्याचे सर्वात महत्त्वाचे साधन", "नोकरी शोधताना उपयोगी गोष्ट"],

    ["नवीन अवसर तयार करा", "नवीन संधी तयार करा"],
    ["नवीन अवसर मिळवा", "नवीन संधी मिळवा"],
    ["अवसर", "संधी"],

    ["इतरांच्या अगोदर जाण्याची संधी", "इतरांपेक्षा पुढे जाण्याची संधी"],

    ["आपण नोकरी शोधताना", "नोकरी शोधताना"],
    ["आपल्या नोकरीच्या शोधात", "नोकरी शोधताना"]
  ];

  let result = text;

  for (const [bad, good] of replacements) {
    result = result.split(bad).join(good);
  }

  return result;
}


/* =====================================================
   MARATHI NATURALIZER
===================================================== */

async function naturalizeMarathi(post) {

  const prompt = `
You are the final Marathi editor for PostMitra AI.

Rewrite the LinkedIn post below so it sounds EXACTLY like a normal educated young person from Maharashtra wrote it.

IMPORTANT:

Do not translate English sentences into formal Marathi.

Do not use textbook Marathi.

Do not use government Marathi.

Do not use Sanskrit-heavy Marathi.

Do not use complicated words.

Marathi + English mixing is encouraged when it sounds natural.

Use words that young Marathi LinkedIn users actually use.

Natural words include:

job
resume
LinkedIn
profile
networking
connect
contact
skills
experience
career
opportunity
interview
message
share
online
application
field
company

Do NOT unnecessarily translate these words.

==================================================
NEVER USE THESE TYPES OF SENTENCES
==================================================

"नोकरीच्या अधिकृत संधी"

"नोकरीचा आमंत्रण मिळू शकतो"

"नेटवर्किंग आपल्याला संधी दाखवू शकते"

"तुमच्या अनुभवाचा लेख किंवा संपर्क साधा"

"तुमच्या उद्योजकतेचा वापर करा"

"तुमच्या संपर्कांच्या माध्यमातून"

"संपर्कांच्या माध्यमातून तुम्ही"

These sound translated or unnatural.

==================================================
NATURAL STYLE
==================================================

Instead of:

"नोकरीच्या अधिकृत संधी"

write:

"नोकरीच्या नवीन संधी"

Instead of:

"नोकरीचा आमंत्रण मिळू शकतो"

write:

"एखाद्या contact मुळे job opportunity मिळू शकते."

Instead of:

"संपर्कांच्या माध्यमातून"

write:

"योग्य लोकांशी connect झाल्यामुळे"

Instead of:

"नेटवर्किंग आपल्याला नोकरीच्या बाहेर असलेल्या संधी दाखवू शकते"

write:

"Networking मुळे आपल्याला अशा opportunities मिळू शकतात ज्या online search करताना दिसत नाहीत."

==================================================
WRITING STYLE
==================================================

Write like a Marathi LinkedIn creator.

Short paragraphs.

Short sentences.

Natural pauses.

Conversational tone.

No essay style.

No formal introduction.

No unnecessary explanation.

No forced motivational quotes.

No fake personal story.

No invented statistics.

No invented experience.

Do not repeatedly start sentences with:

तुम्ही

आपण

तुमच्या

आपल्या

Vary the sentences naturally.

==================================================
VERY IMPORTANT
==================================================

After rewriting every sentence, ask:

"Would a real Marathi person actually write this sentence on LinkedIn?"

If NO:

Rewrite it.

If a Marathi sentence feels awkward, use a natural Marathi-English mix instead.

Natural language is more important than pure Marathi.

Keep the original meaning.

Do not add new facts.

Keep 3-5 hashtags.

Return ONLY the final post.

POST:

${post}
`;

  let result = await callAI(prompt);

  result = cleanMarathi(result);

  return result;
}


/* =====================================================
   GENERATE
===================================================== */

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

    const languageText =
      String(language || "").toLowerCase();

    const isMarathi =
      languageText.includes("marathi");

    const isHindi =
      languageText.includes("hindi");


    /* ================================================
       MARATHI GENERATION
    ================================================= */

    if (isMarathi) {

      const prompt = `
You are PostMitra AI.

Create a natural LinkedIn post in everyday Marathi used in Maharashtra.

TOPIC:
${topic}

TONE:
${tone}

LENGTH:
${length}

AUDIENCE:
${audience || "general LinkedIn audience"}

==================================================
IMPORTANT LANGUAGE RULE
==================================================

This is NOT a Marathi translation task.

Write directly in natural Marathi.

Marathi-English mixing is allowed.

Use English words naturally:

LinkedIn
job
resume
networking
skills
career
profile
connect
contact
experience
opportunity
interview
message
online
application

Do NOT translate these unnecessarily.

==================================================
DO NOT USE
==================================================

अविभाज्य भाग
अधिकृत नोकरीच्या संधी
नोकरीचा आमंत्रण
नोकरीचे आमंत्रण
संपर्कांच्या माध्यमातून
तुमच्या उद्योजकतेचा वापर
कौशल्यांचे दर्शन
अनुस्मरण
अगोदर्शक
अनन्यसाधारण
प्रभावी संवादाचे महत्त्व
संपर्ठ
दृष्टीकोण

==================================================
NATURAL MARATHI
==================================================

Prefer:

महत्त्वाचा भाग
नोकरीची संधी
नवीन opportunity
योग्य लोकांशी connect होणं
contact मध्ये राहणं
तुमचा experience share करणं
तुमची skills दाखवणं
profile नीट ठेवणं
message करणं

==================================================
POST STYLE
==================================================

Start with a natural hook.

Do NOT start with:

"आजच्या डिजिटल युगात"

"आजच्या आधुनिक काळात"

"हे लक्षात घेणे महत्त्वाचे आहे"

"यशस्वी होण्यासाठी"

"नोकरी मिळवण्यासाठी हे आवश्यक आहे"

Instead start with a question, observation or relatable situation.

Example style:

"नोकरी शोधताना आपण कुठे चुकतो?"

"Resume पाठवून reply ची वाट पाहत बसतोय?"

"LinkedIn वर profile आहे, पण networking किती करतो?"

Do NOT copy these examples exactly.

==================================================
BODY
==================================================

Give practical value.

Use short paragraphs.

Make it sound like a real person.

Avoid essay-like explanations.

Do not repeat the same idea.

Do not use fake statistics.

Do not invent personal experiences.

==================================================
ENDING
==================================================

End naturally.

A simple suggestion or question is enough.

Do not force a motivational CTA.

==================================================
HASHTAGS
==================================================

Use 3-5 relevant hashtags.

==================================================
CREATE 5 POSTS
==================================================

Each post must be different.

POST 1:
Relatable observation

POST 2:
Practical advice

POST 3:
Realistic situation

POST 4:
Opinion

POST 5:
Simple lesson

==================================================
OUTPUT
==================================================

POST 1
[post]

---

POST 2
[post]

---

POST 3
[post]

---

POST 4
[post]

---

POST 5
[post]

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

Return ONLY this format.
`;

      console.log("MARATHI GENERATION STARTED...");

      let generatedPost = await callAI(prompt);

      console.log("MARATHI FIRST GENERATION DONE.");

      generatedPost =
        await naturalizeMarathi(generatedPost);

      console.log("MARATHI NATURALIZATION DONE.");

      generatedPost =
        cleanMarathi(generatedPost);

      console.log("MARATHI CLEANUP DONE.");

      return res.json({
        success: true,
        post: generatedPost
      });
    }


    /* ================================================
       HINDI / ENGLISH
    ================================================= */

    let languageRules = "";

    if (isHindi) {

      languageRules = `
Use natural conversational Indian Hindi.

Hindi-English mixing is allowed.

Avoid textbook Hindi.

Avoid overly formal Hindi.

Write like a real Indian LinkedIn creator.
`;

    } else {

      languageRules = `
Use natural conversational professional English.

Avoid corporate buzzwords.

Avoid generic AI phrases.

Use simple vocabulary.

Write like a real LinkedIn creator.
`;
    }


    const prompt = `
You are PostMitra AI.

Create natural LinkedIn posts.

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

Write like a real person.

Avoid robotic writing.

Avoid generic motivational phrases.

Do not invent facts.

Do not invent personal experiences.

Use short paragraphs.

Create 5 genuinely different posts.

POST 1:
Relatable observation

POST 2:
Practical advice

POST 3:
Realistic situation

POST 4:
Opinion

POST 5:
Simple lesson

OUTPUT:

POST 1
[post]

---

POST 2
[post]

---

POST 3
[post]

---

POST 4
[post]

---

POST 5
[post]

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
`;

    const generatedPost =
      await callAI(prompt);

    res.json({
      success: true,
      post: generatedPost
    });

  } catch (error) {

    console.error(
      "GENERATE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/* =====================================================
   IMPROVE
===================================================== */

app.post("/api/improve", async (req, res) => {

  try {

    const { post } = req.body;

    if (!post) {
      throw new Error("No post provided");
    }

    const prompt = `
You are PostMitra AI's final human editor.

Rewrite the following LinkedIn post so it sounds like a real person wrote it.

Keep the meaning.

Do not add facts.

Do not invent stories.

Do not make it formal.

If the post is Marathi:

Use everyday Maharashtra Marathi.

Marathi-English mixing is allowed.

Natural words:

job
resume
LinkedIn
networking
connect
contact
skills
experience
career
opportunity
profile
message
share

Avoid:

अविभाज्य भाग
अधिकृत नोकरीच्या संधी
नोकरीचा आमंत्रण
नोकरीचे आमंत्रण
संपर्कांच्या माध्यमातून
कौशल्यांचे दर्शन
अनुस्मरण
अगोदर्शक
अनन्यसाधारण
प्रभावी संवादाचे महत्त्व
संपर्ठ
दृष्टीकोण

Use short paragraphs.

Avoid repeated sentence structures.

Do not sound like a textbook.

Do not sound like a translated English article.

Write like a young Marathi LinkedIn creator.

Return ONLY the final post.

POST:

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

    console.error(
      "IMPROVE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/* =====================================================
   SERVER
===================================================== */

app.listen(3000, () => {

  console.log(
    "PostMitra AI server running on http://localhost:3000"
  );

});
