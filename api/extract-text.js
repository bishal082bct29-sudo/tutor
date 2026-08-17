import { GoogleGenAI, Type } from '@google/genai';

let aiClient = null;
function getGenAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
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

    const prompt = `You are a high-precision OCR and document analysis engine for Gurukul Home Tuitions in Kathmandu Valley, Nepal.
Your task is to transcribe and extract EXACT details from this tuition vacancy flyer image.

CRITICAL INSTRUCTIONS:
1. TITLE:
   - Extract the exact headline/title printed on the flyer (e.g. "Home Tuition Requirement", "Class 10 Opt. Math Tutor", "Male/Female Tutor Needed").
   - If there is no single explicit headline, construct a clean title strictly using the exact extracted Class, Subject, and Location: "[Class] [Subject] Tutor – [Location]".

2. CLASS / GRADE / LEVEL (MUST BE EXACT):
   - Extract the exact class/grade printed on the image (e.g., "Class 10 (SEE)", "Class 9", "Class 8 (BLE)", "Class 7", "Class 6", "Class 5", "Class 4", "Class 3", "Class 2", "Class 1", "Class 1–5", "Class 6–8", "Nursery", "LKG", "UKG", "Playgroup", "+2 Science", "+2 Management", "Grade 11 & 12", "Bachelor Level", "A-Levels / CBSE").
   - Do NOT omit the class number or use generic phrases if a specific class is present.

3. LOCATION (MUST BE EXACT):
   - Extract the exact location, neighborhood, area, landmark, or street printed on the flyer (e.g., "New Baneshwor, Kathmandu", "Kumaripati (near Mahayan), Lalitpur", "Kalanki, Kathmandu", "Satdobato, Lalitpur", "Koteshwor", "Chabahil", "Boudha", "Bhaisepati", "Sanepa", "Jhamsikhel", "Thimi, Bhaktapur", "Suryabinayak", "Baluwatar", "Maharajgunj", "Kirtipur", "Gwarko", "Imadol", etc.).
   - Include the specific area and landmark if printed.

4. SALARY / FEE / PAY (MUST BE EXACT):
   - Extract the exact salary / fee amount as printed on the flyer (e.g., "Rs. 15,000 / month", "NPR 14,000 / month", "Rs. 12,000 – 15,000 / mo", "Rs. 8,000 / month", "Rs. 20,000").
   - Preserve currency notation (Rs. / NPR) and time frame (/ month).

5. TIME / SCHEDULE / TIMING (MUST BE EXACT):
   - Extract the exact time, hours, or shift printed on the flyer (e.g., "6:00 AM – 7:30 AM", "5:00 PM – 6:30 PM", "6:30 AM (Morning)", "Evening 1.5 Hours", "6 Days a Week", "Morning Batch").

6. SUBJECT(S) (MUST BE EXACT):
   - Extract the exact subjects printed on the flyer (e.g., "Comp. & Opt. Mathematics", "Science", "Physics & Chemistry", "Accountancy", "Economics", "All Subjects", "English", "Nepali", "Social Studies").

7. EMPLOYMENT TYPE:
   - Select the most accurate: "Part-time" | "Full-time" | "Weekend only" | "Morning Batch" | "Evening Batch" | "Online".

8. RAW TEXT:
   - Provide the complete verbatim transcription of every word, number, phone number, and note visible on the flyer.`;

    const modelsToTry = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.7-flash'];
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
            maxOutputTokens: 1024,
            thinkingConfig: {
              thinkingBudget: 0
            },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                rawText: { type: Type.STRING, description: 'All raw OCR text transcribed from the image' },
                title: { type: Type.STRING, description: 'Descriptive title with class, subject and location' },
                subject: { type: Type.STRING, description: 'Tutoring subject(s)' },
                level: { type: Type.STRING, description: 'Exact class / grade / level (e.g. Class 10 (SEE), Grade 7, +2 Science)' },
                type: { type: Type.STRING, description: 'Part-time | Full-time | Weekend only | Morning Batch | Evening Batch | Online' },
                location: { type: Type.STRING, description: 'Specific area / neighborhood in Kathmandu Valley' },
                salary: { type: Type.STRING, description: 'Salary / monthly fee (e.g. NPR 15,000 / month)' },
                schedule: { type: Type.STRING, description: 'Timing or schedule (e.g. 5:00 PM - 6:30 PM)' },
                description: { type: Type.STRING, description: 'Summary of vacancy requirements' }
              },
              required: ['rawText', 'title', 'subject', 'level', 'location']
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
