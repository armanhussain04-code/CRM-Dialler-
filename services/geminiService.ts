
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";

// Standard decoding for audio data from the SDK
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const verifyNoteQuality = async (note: string, duration: string): Promise<{ isValid: boolean, reason?: string }> => {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Audit this CRM call note for quality. 
      Duration: ${duration}
      Note: "${note}"
      
      Is this note meaningful and related to a business call? 
      Reject if it's:
      1. Gibberish (e.g. "asdfgh")
      2. Highly repetitive (e.g. "ok ok ok ok ok")
      3. Too generic for a long call (e.g. just saying "done" for a 5 minute call)
      4. Completely unrelated text.

      Respond ONLY in JSON format: {"isValid": boolean, "reason": "short explanation in Hindi/English if invalid"}`,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || '{"isValid": true}');
    return result;
  } catch (err) {
    console.error("AI Audit failed, falling back to basic check", err);
    // Fallback if API fails: basic length and repetition check
    const isRepetitive = /(.)\1{4,}/.test(note) || note.split(' ').length < 2 && duration.includes('m');
    return { isValid: !isRepetitive };
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Kore') => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const generateImage = async (prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" = "1:1") => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: { aspectRatio }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const startChatSession = (systemInstruction: string) => {
  const ai = getGeminiClient();
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction }
  });
};
