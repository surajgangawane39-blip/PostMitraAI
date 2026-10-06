require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("PostMitra AI backend is running!");
});


/* =====================================================
   AI CALL
===================================================== */

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

        temperature: 0.7
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

    ["अधिकृत नोकरीच्या संधी", "नोकरीच्या नवीन संधी"],
    ["अधिकृत संधी", "नवीन संधी"],
    ["नोकरीच्या अधिकृत संधी", "नोकरीच्या नवीन संधी"],

    ["नोकरीचा आमंत्रण मिळू शकतो", "एखाद्या contact मुळे job opportunity मिळू शकते"],
    ["नोकरीचा आमंत्रण", "नोकरीची संधी"],
    ["नोकरीचे आमंत्रण", "नोकरीची संधी"],
    ["नोकरीच्या आमंत्रण", "नोकरीची संधी"],
    ["आमंत्रण मिळू शकतो", "संधी मिळू शकते"],

    ["उद्योजकतेचा आणि विश्वासाचा वापर", "आपलं काम आणि अनुभव नीट सांगणं"],
    ["तुमच्या उद्योजकतेचा वापर करा", "तुमचा अनुभव आणि skills योग्य पद्धतीने दाखवा"],

    ["नेटवर्किंग स्ट्रॅटेजी", "networking plan"],
    ["नेटवर्किंग आपल्याला", "Networking मुळे"],
    ["नेटवर्किंग म्हणजे", "Networking म्हणजे"],

    ["तुमच्या संपर्कांचं महत्त्व", "तुमच्या contacts चं महत्त्व"],
    ["संपर्कांचं महत्त्व", "contacts चं महत्त्व"],
    ["संपर्कांच्या माध्यमातून", "योग्य लोकांशी connect झाल्यामुळे"],
    ["संपर्कांच्या माध्यमातून तुम्ही", "योग्य लोकांशी connect झाल्यामुळे तुम्हाला"],

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
    ["अनुभवाचा लेख", "experience share करा"],

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
    ["अनन्यसाधारण", "खूप महत्त्वाचं"],
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
    ["आपल्या नोकरीच्या शोधात", "नोकरी शोधताना"],

    /* Hindi / bad mixed-language cleanup */

    ["क्या आपण", "तुम्ही"],
    ["क्या तुम्ही", "तुम्ही"],
    ["क्या आपण", "तुम्ही"],

    ["एआई", "AI"],
    ["एआय", "AI"],

    ["करियर करण्याची विचार", "career करण्याचा विचार"],
    ["करिअर करण्याची विचार", "career करण्याचा विचार"],

    ["ही नोकरी जास्त डेल", "या क्षेत्रात jobs ची मागणी वाढत आहे"],

    ["आपण आपले अनुभव शेअर करा", "तुमचा experience share करा"],

    ["तुम्ही आपले", "तुमचे"],
    ["आपले प्रोफाईल", "तुमचा profile"],
    ["आपल्या प्रोफाईल", "तुमचा profile"]

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
You are the FINAL Marathi LinkedIn editor for PostMitra AI.

Your job is NOT to translate the post.

Your job is to rewrite the existing post so it sounds like it was originally written by a real young, educated Marathi person from Maharashtra.

==================================================
MOST IMPORTANT RULE
==================================================

THINK IN MARATHI.

Do NOT translate English or Hindi sentence-by-sentence.

Do NOT preserve unnatural sentence structures.

Write naturally from a Marathi speaker's perspective.

==================================================
LANGUAGE
==================================================

Use natural everyday Marathi used by educated Marathi speakers in Maharashtra.

Marathi grammar must be correct.

NEVER mix Hindi into Marathi.

NEVER use Hindi words such as:

क्या
है
हैं
करना
करते हैं
यह
वह
और
लेकिन
आपको
आपका
आपकी
आपके
क्योंकि
इसलिए
सकते हैं
मिलता है
होता है

If any Hindi sentence appears, rewrite the complete sentence in Marathi.

==================================================
AI
==================================================

NEVER write:

एआई
एआय

Always write:

AI

==================================================
MARATHI + ENGLISH
==================================================

Natural Marathi-English mixing is encouraged.

Keep these common professional words in English:

AI
LinkedIn
job
career
resume
profile
networking
network
connect
contact
skills
experience
opportunity
interview
message
share
online
application
company
startup
business
technology
marketing
content
creator
professional
team
project
growth

Do NOT force translations of these words.

==================================================
NATURAL MARATHI STYLE
==================================================

Use simple Marathi.

Use short sentences.

Use short paragraphs.

Sound conversational.

Sound professional but friendly.

Write like a young Marathi LinkedIn creator.

Do NOT sound like:

a textbook
a government document
a newspaper translation
Google Translate
an AI-generated essay

==================================================
AVOID THESE WORDS / PHRASES
==================================================

Never use:

अविभाज्य भाग
अधिकृत नोकरीच्या संधी
नोकरीचा आमंत्रण
नोकरीचे आमंत्रण
नोकरीच्या आमंत्रण
तुमच्या उद्योजकतेचा वापर
संपर्कांच्या माध्यमातून
तुमच्या अनुभवाचा लेख
कौशल्यांचे दर्शन
अनुस्मरण
अगोदर्शक
अनन्यसाधारण
प्रभावी संवादाचे महत्त्व
संपर्ठ
दृष्टीकोण
जास्त डेल

Also avoid unnecessarily formal words.

==================================================
NATURAL EXAMPLES
==================================================

BAD:

"क्या आपण एआईच्या क्षेत्रात करियर करण्याची विचार करत आहात?"

GOOD:

"तुम्ही AI क्षेत्रात career करण्याचा विचार करत आहात का?"

BAD:

"ही नोकरी जास्त डेल आणि भविष्यातील तंत्रज्ञानाच्या विकासासाठी महत्त्वाची आहे."

GOOD:

"AI क्षेत्रातील jobs ची मागणी वाढत आहे. त्यामुळे या field मध्ये योग्य skills असणं महत्त्वाचं आहे."

BAD:

"आपण आपले अनुभव शेअर करा."

GOOD:

"तुमचा experience comment मध्ये share करा."

BAD:

"संपर्कांच्या माध्यमातून तुम्ही संधी मिळवू शकता."

GOOD:

"योग्य लोकांशी connect झाल्यामुळे नवीन opportunities मिळू शकतात."

==================================================
SENTENCE STYLE
==================================================

Do not repeatedly start sentences with:

तुम्ही
आपण
तुमच्या
आपल्या

Vary sentence structures naturally.

Do not make every sentence follow the same pattern.

==================================================
CONTENT RULES
==================================================

Keep the original meaning.

Do NOT add new facts.

Do NOT invent statistics.

Do NOT invent personal experiences.

Do NOT create fake numbers.

Do NOT create fake success stories.

If the original contains a statistic, keep it.

If there is no statistic, do not create one.

==================================================
HASHTAGS
==================================================

Keep 3-5 relevant hashtags.

English hashtags are completely acceptable.

==================================================
FINAL CHECK
==================================================

Before returning the final post, silently check every sentence:

1. Is it natural Marathi?
2. Is there any Hindi?
3. Is the grammar correct?
4. Does it sound like a real Marathi person?
5. Did I translate anything literally?
6. Did I use unnecessarily difficult Marathi?
7. Did I invent any fact?
8. Did I accidentally write "एआई" instead of "AI"?

If anything is wrong, rewrite it.

Return ONLY the final polished LinkedIn post.

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

Create a natural LinkedIn post directly in everyday Marathi used in Maharashtra.

This is NOT a translation task.

Think in Marathi and write naturally.

TOPIC:
${topic}

TONE:
${tone}

LENGTH:
${length}

AUDIENCE:
${audience || "general LinkedIn audience"}

==================================================
CRITICAL LANGUAGE RULES
==================================================

Write directly in Marathi.

NEVER translate from Hindi.

NEVER translate English sentences word-for-word.

Use natural Marathi grammar.

NEVER mix Hindi into Marathi.

Never use:

क्या
है
हैं
करना
यह
वह
और
लेकिन
आपको
आपका
आपकी
क्योंकि
इसलिए

NEVER write:

एआई
एआय

Always write:

AI

==================================================
MARATHI + ENGLISH
==================================================

Natural Marathi-English mixing is encouraged.

Keep these words in English when natural:

AI
LinkedIn
job
career
resume
profile
networking
connect
contact
skills
experience
opportunity
interview
message
share
online
application
company
startup
business
technology
marketing
content
creator
professional
team
project
growth

Do not force Marathi translations of these words.

==================================================
NATURAL MARATHI
==================================================

Write like a real Marathi LinkedIn creator from Maharashtra.

Use:

simple Marathi
short sentences
short paragraphs
conversational language
professional but friendly tone

Avoid:

textbook Marathi
government Marathi
Sanskrit-heavy Marathi
Google Translate style
formal essay style
robotic AI language

==================================================
DO NOT USE THESE PHRASES
==================================================

अविभाज्य भाग
अधिकृत नोकरीच्या संधी
नोकरीचा आमंत्रण
नोकरीचे आमंत्रण
नोकरीच्या आमंत्रण
तुमच्या उद्योजकतेचा वापर
संपर्कांच्या माध्यमातून
तुमच्या अनुभवाचा लेख
कौशल्यांचे दर्शन
अनुस्मरण
अगोदर्शक
अनन्यसाधारण
प्रभावी संवादाचे महत्त्व
संपर्ठ
दृष्टीकोण

==================================================
HOOK
==================================================

Start with a natural hook.

Good hook styles:

question
relatable problem
observation
simple statement

Do NOT start with:

"आजच्या डिजिटल युगात"

"आजच्या आधुनिक काळात"

"हे लक्षात घेणे महत्त्वाचे आहे"

"यशस्वी होण्यासाठी"

"नोकरी मिळवण्यासाठी हे आवश्यक आहे"

Do not copy these examples exactly.

==================================================
BODY
==================================================

Give practical value.

Use short paragraphs.

Make the post useful.

Do not repeat the same idea.

Do not make it sound like an essay.

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

English hashtags are allowed.

==================================================
CREATE 5 POSTS
==================================================

Each post must be genuinely different.

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
FINAL LANGUAGE CHECK
==================================================

Before returning the output, silently check:

- No Hindi words
- No Hindi sentence structure
- No "एआई"
- No unnatural literal translations
- Correct Marathi grammar
- Natural Marathi-English mix
- No invented statistics
- No invented facts
- Sounds like a real Marathi LinkedIn creator

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

      let generatedPost =
        await callAI(prompt);

      console.log(
        "MARATHI FIRST GENERATION DONE."
      );

      generatedPost =
        await naturalizeMarathi(generatedPost);

      console.log(
        "MARATHI NATURALIZATION DONE."
      );

      generatedPost =
        cleanMarathi(generatedPost);

      console.log(
        "MARATHI CLEANUP DONE."
      );

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

Keep the original meaning.

Do not add facts.

Do not invent stories.

Do not invent statistics.

Do not make it overly formal.

==================================================
IF THE POST IS MARATHI
==================================================

Use natural everyday Maharashtra Marathi.

Think in Marathi.

Do NOT translate English or Hindi sentence-by-sentence.

Do NOT use Hindi words.

Never use:

क्या
है
हैं
करना
यह
वह
और
लेकिन
आपको
आपका
आपकी
क्योंकि
इसलिए

Never write:

एआई
एआय

Always write:

AI

==================================================
MARATHI + ENGLISH
==================================================

Natural Marathi-English mixing is allowed.

Use common English words naturally:

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
online
application
company
startup
business
technology
project
growth

==================================================
AVOID
==================================================

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
जास्त डेल

==================================================
STYLE
==================================================

Short paragraphs.

Short sentences.

Natural conversational Marathi.

Professional but friendly.

Write like a young Marathi LinkedIn creator.

Do not sound like a textbook.

Do not sound like Google Translate.

Do not use unnecessary difficult Marathi.

Do not repeat the same sentence structure.

Keep 3-5 relevant hashtags.

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
