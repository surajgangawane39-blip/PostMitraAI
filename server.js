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
// OPENROUTER HELPER
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

  const content =
    data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.text;

  if (!content) {
    throw new Error("No content returned from AI");
  }

  return content;
}


// ======================================================
// GENERATE POSTS
// ======================================================

app.post("/generate", async (req, res) => {
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

    let languageInstructions = "";

    // ==================================================
    // MARATHI
    // ==================================================

    if (isMarathi) {
      languageInstructions = `
MARATHI WRITING MODE — VERY IMPORTANT

Write in NATURAL SPOKEN MARATHI used by young Marathi professionals and creators.

The reader should feel:

"हा माणूस खरंच LinkedIn वर स्वतः लिहितोय."

NOT:

"हा मजकूर AI ने मराठीत translate केला आहे."

Use everyday Marathi.

GOOD NATURAL WORDS / STYLE:
- चांगलं
- काम
- नोकरी
- संधी
- लोक
- अनुभव
- शिकायला मिळालं
- लक्षात आलं
- उपयोगी ठरतं
- आपण
- आपल्याला
- तुमचं
- माझं
- खरं सांगायचं तर
- अनेकदा
- कधी कधी
- आजकाल
- शेवटी
- याचा एक फायदा असा आहे

Marathi-English mixing is allowed when people naturally use the English word on LinkedIn.

Natural examples:
- LinkedIn profile
- resume
- interview
- networking
- skills
- career
- job search
- experience
- communication
- personal brand
- content
- profile
- headline

DO NOT translate these words into awkward Marathi just to make the post 100% Marathi.

VERY IMPORTANT:

NEVER use unnatural literal translations.

Avoid words/phrases such as:

"उमेदवार मित्र"
"उमेदवारीचा आकर्षक"
"प्रोफाईलचा आकर्षक दर्शवा"
"अगोदर्शक"
"अनुस्मरण करा"
"तात्पुरते संपर्क"
"प्रभावी संवादाचे अनन्यसाधारण महत्त्व"
"संधीच्या वेळी संपर्क साधणे"
"आपल्या उमेदवारीचा आकर्षक"
"आपल्या कौशल्यांची यादी जोडू शकता" when it sounds translated
"महत्त्वपूर्ण साधन"
"अत्यंत महत्त्वाचे साधन"
"यशस्वी होण्यासाठी आवश्यक आहे"
"याचा उपयोग करून घेणे आवश्यक आहे"

Also avoid Sanskrit-heavy/formal words when a normal Marathi word exists.

For example:

BAD:
"नेटवर्किंग हे नोकरी शोधण्याचे सर्वात महत्त्वाचे साधन आहे."

BETTER:
"नोकरी शोधताना फक्त job portals वर depend राहून चालत नाही. योग्य लोकांशी ओळख असणंही तितकंच महत्त्वाचं आहे."

BAD:
"आपल्या प्रोफाईलचा आकर्षक दर्शवा."

BETTER:
"तुमचा LinkedIn profile थोडा नीट update करा."

BAD:
"त्यांच्या अनुभवाविषयी चौकशी करा."

BETTER:
"त्यांचा experience कसा होता, हे विचारून बघा."

The Marathi should sound like a person from Maharashtra talking naturally, not like a school textbook.

Do NOT force Marathi grammar so much that the writing becomes unnatural.

Use "आपण", "आपल्याला", "तुम्ही", "तुमचं", "आपलं" naturally.

Do not repeatedly start sentences with:
"आपण..."
"आपल्या..."
"तुम्ही..."

Vary the sentence structure.

The post should feel like something a Marathi LinkedIn creator could actually publish.

IMPORTANT:
Before finalizing every Marathi sentence, mentally ask:

"एखादा Marathi creator ही line WhatsApp/LinkedIn वर खरंच अशी लिहील का?"

If NO, rewrite it in simpler Marathi.
`;
    }

    // ==================================================
    // HINDI
    // ==================================================

    else if (isHindi) {
      languageInstructions = `
HINDI WRITING MODE

Write in natural conversational Indian Hindi.

Avoid textbook Hindi.

Hindi-English mixing is completely allowed when natural.

Use words people actually use on LinkedIn and social media.

For example:
LinkedIn profile, resume, interview, networking, skills, career, job search, experience, communication.

Do NOT translate English words into unnecessarily formal Hindi.

Avoid robotic phrases such as:
"यह अत्यंत महत्वपूर्ण है"
"इस संदर्भ में"
"उम्मीदवारों को यह समझना चाहिए"
"यह कहना गलत नहीं होगा"
"आज के बदलते परिदृश्य में"

Write like a real Indian creator.
`;
    }

    // ==================================================
    // ENGLISH
    // ==================================================

    else {
      languageInstructions = `
ENGLISH WRITING MODE

Write natural conversational professional English.

Avoid:
- corporate buzzwords
- generic AI phrases
- overly sophisticated vocabulary
- fake motivational language
- repetitive sentence patterns

Write like a real LinkedIn creator.

Use contractions when natural.

Keep the writing clear and easy to read.
`;
    }


    const prompt = `
You are PostMitra AI.

You are NOT writing an essay.

You are writing a LinkedIn post that a REAL PERSON would publish.

Your biggest priority is:

NATURAL HUMAN WRITING.

The post must NOT feel AI-generated.

LANGUAGE:
${language}

TONE:
${tone}

AUDIENCE:
${audience || "general LinkedIn audience"}

TOPIC:
${topic}

LENGTH:
${length}


==================================================
CORE HUMAN WRITING RULES
==================================================

1. Write like a real person talking to another person.

2. Use simple language.

3. Prefer clarity over fancy vocabulary.

4. Avoid corporate language.

5. Avoid textbook language.

6. Avoid motivational clichés.

7. Avoid unnecessary explanations.

8. Do not repeat the same idea.

9. Do not make every sentence the same length.

10. Do not make every paragraph follow the same pattern.

11. Do not force a hook.

12. Do not force a CTA.

13. Do not use fake personal stories.

14. Do not invent statistics.

15. Do not invent experiences.

16. Do not use unnecessary emojis.

17. Use 3-5 hashtags maximum.

18. The post should contain an actual useful thought, observation, lesson or practical advice.

19. Make the reader feel:

"हे खरंच कोणीतरी स्वतः लिहिलंय."

NOT:

"हे AI-generated content आहे."


==================================================
NEVER USE GENERIC AI OPENINGS
==================================================

Avoid:

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

"Remember that..."

"Whether you are..."

"Unlock your potential..."

"Embrace the journey..."

"Transform your career..."


==================================================
LINKEDIN STYLE
==================================================

LinkedIn posts should feel:

personal
clear
useful
relatable
conversational

Use short paragraphs.

Usually 1-3 sentences per paragraph.

Do not make the post look like an article.

Do not add headings like:

Introduction
Key Takeaways
Conclusion

unless genuinely necessary.


==================================================
HOOK
==================================================

The first 1-2 lines should make the reader want to continue.

But DO NOT use clickbait.

Good hooks can be:

a simple observation
a common mistake
a relatable situation
a surprising thought
a practical question
a personal-style observation

The hook should naturally connect to the topic.


==================================================
BODY
==================================================

Give useful information.

Prefer specific advice over generic motivation.

For example:

BAD:
"Keep improving yourself and success will follow."

BETTER:
"If you're applying for jobs every day but getting very few replies, check your resume before sending another application."


==================================================
CTA
==================================================

CTA should be natural.

Do NOT automatically say:

"Share your thoughts in the comments below."

Instead, if appropriate:

"What has worked for you?"

"Have you faced this?"

"Try this once and see the difference."

"Save this for your next job search."

Or simply end without a CTA if the post doesn't need one.


${languageInstructions}


==================================================
CREATE 5 DIFFERENT POSTS
==================================================

Create exactly 5 different LinkedIn posts about the same topic.

Each post must feel different.

Possible approaches:

Post 1:
relatable observation

Post 2:
practical advice

Post 3:
short story / situation

Post 4:
strong opinion

Post 5:
simple lesson

Do not force these approaches if they don't fit the topic.


==================================================
QUALITY CHECK BEFORE OUTPUT
==================================================

Before returning the posts, silently check each one.

Ask:

1. Does this sound like a real person?

2. Does any sentence sound translated?

3. Is there any unnecessarily formal word?

4. Is there any awkward phrase?

5. Is the Marathi/Hindi natural?

6. Would a normal LinkedIn user actually write this?

If any answer is NO, rewrite that sentence before returning the final answer.


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

Do not add any explanation before or after the format.
Do not mention AI.
`;


    const post = await callAI(prompt);

    res.json({
      success: true,
      post: post
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

app.post("/improve", async (req, res) => {
  try {
    const { post } = req.body;

    if (!post) {
      throw new Error("No post provided");
    }

    const prompt = `
You are PostMitra AI's Humanize engine.

Rewrite the LinkedIn post below so that it sounds like a REAL PERSON wrote it.

The goal is NOT to make it more professional.

The goal is:

NATURAL
RELATABLE
CONVERSATIONAL
CLEAR
HUMAN

Keep the original meaning and useful information.

Remove:

- robotic language
- AI-sounding phrases
- corporate buzzwords
- textbook language
- unnecessary formal words
- repetitive sentences
- fake motivation
- forced enthusiasm
- unnecessary emojis
- generic CTA


==================================================
MARATHI HUMANIZATION
==================================================

If the post is Marathi:

Use everyday Marathi used by real Marathi-speaking creators.

Marathi-English mixing is allowed.

Do NOT translate English words unnecessarily.

Words like these are completely okay:

LinkedIn
profile
resume
job
career
networking
skills
interview
experience
content
headline
update

Avoid unnatural phrases like:

"उमेदवार मित्र"

"उमेदवारीचा आकर्षक"

"प्रोफाईलचा आकर्षक दर्शवा"

"अगोदर्शकांशी संपर्क"

"अनुस्मरण करा"

"तात्पुरते संपर्क साधा"

"अनन्यसाधारण महत्त्व"

"प्रभावी संवादाचे महत्त्व"

"संधीच्या वेळी संपर्क साधणे"

"आपल्या उमेदवारीचा आकर्षक"

If a sentence sounds like a translation from English, rewrite it completely.

Example:

BAD:
"आपल्या प्रोफाईलचा आकर्षक दर्शवा."

NATURAL:
"तुमचा LinkedIn profile थोडा नीट update करा."

BAD:
"नेटवर्किंग हे नोकरी शोधण्याचे सर्वात महत्त्वाचे साधन आहे."

NATURAL:
"नोकरी शोधताना फक्त job portals वर depend राहून चालत नाही. योग्य लोकांशी ओळख असणंही तितकंच महत्त्वाचं आहे."

These are STYLE examples only.
Do not copy them unless relevant.


==================================================
HINDI HUMANIZATION
==================================================

If Hindi:

Use natural Indian Hindi.

Hindi-English mixing is allowed.

Avoid formal textbook Hindi.


==================================================
ENGLISH HUMANIZATION
==================================================

If English:

Use natural conversational professional English.

Avoid corporate buzzwords.

Avoid generic AI writing.


==================================================
FINAL CHECK
==================================================

Before returning:

Read the rewritten post like a normal person.

If any sentence sounds unnatural, simplify it.

If any word sounds like textbook Marathi/Hindi, replace it with a normal everyday word.

Keep the original meaning.

Return ONLY the improved post.

Do not explain the changes.

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
