import { GoogleGenAI, Type } from '@google/genai';

let aiClient = null;
function getGenAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { image, mimeType } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: 'Image data is required (base64 string or data URL).' });
    }

    let base64Data = image;
    let actualMime = mimeType || 'image/jpeg';

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        actualMime = match[1];
        base64Data = match[2];
      } else {
        base64Data = image.replace(/^data:[^;]+;base64,/, '');
      }
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'GEMINI_API_KEY not configured on server. Falling back to client-side OCR engine.',
        extractedText: '',
        parsed: null
      });
    }

    const prompt = `Extract all text from this tuition job image/flyer and extract tuition vacancy details for Gurukul Home Tuitions in Kathmandu Valley, Nepal.
Extract:
- rawText: Complete OCR transcribed text
- title: Clean vacancy title (e.g. "Grade 10 SEE Mathematics Tutor")
- subject: Subject(s) (e.g. "Comp. & Opt. Mathematics", "Science", "Physics")
- level: Grade/level (e.g. "Class 9 & 10 (SEE)", "+2 Science", "Class 1–5")
- type: "Part-time" | "Full-time" | "Weekend only" | "Morning Batch" | "Evening Batch" | "Online"
- location: Kathmandu Valley location (e.g. "Baneshwor, Kathmandu", "Kumaripati, Lalitpur")
- salary: Monthly salary/fee (e.g. "NPR 14,000 / month")
- schedule: Timing/hours (e.g. "5:00 PM – 6:30 PM")`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: actualMime,
                    data: base64Data
                  }
                },
                {
                  text: prompt
                }
              ]
            }
          ],
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                rawText: { type: Type.STRING },
                title: { type: Type.STRING },
                subject: { type: Type.STRING },
                level: { type: Type.STRING },
                type: { type: Type.STRING },
                location: { type: Type.STRING },
                salary: { type: Type.STRING },
                schedule: { type: Type.STRING }
              },
              required: ['rawText', 'title', 'subject']
            }
          }
        });
        if (response && response.text) {
          break; // Success!
        }
      } catch (err) {
        lastError = err;
        const msg = err?.message || String(err);
        console.warn(`Model ${modelName} returned error (${msg}). Trying fallback...`);
      }
    }

    if (!response || !response.text) {
      return res.status(200).json({
        fallback: true,
        message: lastError ? (lastError.message || 'Models busy') : 'Could not reach model, switching to client OCR.',
        extractedText: '',
        parsed: null
      });
    }

    const textOutput = response.text;
    let parsedData = null;
    try {
      parsedData = JSON.parse(textOutput);
    } catch (e) {
      parsedData = { rawText: textOutput, title: '', subject: '' };
    }

    return res.status(200).json({
      success: true,
      extractedText: parsedData.rawText || '',
      parsed: parsedData
    });
  } catch (err) {
    console.warn('OCR / Text Extraction Fallback Triggered:', err?.message || err);
    return res.status(200).json({
      fallback: true,
      error: err.message || 'Failed to extract text from image',
      extractedText: '',
      parsed: null
    });
  }
}
