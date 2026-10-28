export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    // थेट Google कडून चालू मॉडेल्सची अधिकृत यादी मागवणे
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(listUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch models list");
    }

    // फक्त generateContent सपोर्ट असणाऱ्या मॉडेल्सची नावे गोळा करणे
    const supportedModels = (data.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace("models/", ""));

    return res.status(200).json({
      success: true,
      post: `चालू मॉडेल्सची यादी:\n\n${supportedModels.join("\n")}`
    });

  } catch (error) {
    console.error("DEBUG ERROR:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
