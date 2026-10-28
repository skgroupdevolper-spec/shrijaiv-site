// Chatbot settings (Setting key "chatbot"). Keys are masked for the browser like the publisher's.
import { prisma } from '@/lib/db';
import { deepMerge, maskSecrets, unmaskSecrets } from '@/lib/ai/pure';
import type { ProviderId } from '@/lib/ai/config';

export const GREETINGS: Record<string, string> = {
  en: 'Namaste! I can help you find organic products, verified sellers and buyers, post a requirement or choose a plan. How can I help?',
  hi: 'नमस्ते! मैं ऑर्गेनिक उत्पाद, वेरिफ़ाइड सेलर और बायर खोजने, रिक्वायरमेंट पोस्ट करने या प्लान चुनने में मदद कर सकता हूँ। बताइए, कैसे मदद करूँ?',
  ur: 'السلام علیکم! میں آرگینک پروڈکٹس، تصدیق شدہ سیلرز اور بائرز تلاش کرنے، ضرورت پوسٹ کرنے یا پلان منتخب کرنے میں مدد کر سکتا ہوں۔ کیسے مدد کروں؟',
  bn: 'নমস্কার! আমি অর্গানিক পণ্য, যাচাইকৃত বিক্রেতা ও ক্রেতা খুঁজতে, চাহিদা পোস্ট করতে বা প্ল্যান বেছে নিতে সাহায্য করতে পারি। কীভাবে সাহায্য করব?',
  ta: 'வணக்கம்! ஆர்கானிக் பொருட்கள், சரிபார்க்கப்பட்ட விற்பனையாளர்கள் மற்றும் வாங்குபவர்களைத் தேட, தேவையைப் பதிவிட அல்லது திட்டத்தைத் தேர்வு செய்ய உதவுகிறேன். எப்படி உதவலாம்?',
  te: 'నమస్కారం! ఆర్గానిక్ ఉత్పత్తులు, ధృవీకరించిన విక్రేతలు మరియు కొనుగోలుదారులను కనుగొనడంలో, అవసరాన్ని పోస్ట్ చేయడంలో లేదా ప్లాన్ ఎంచుకోవడంలో సహాయం చేస్తాను. ఎలా సహాయం చేయాలి?',
  mr: 'नमस्कार! मी ऑरगॅनिक उत्पादने, व्हेरिफाइड विक्रेते आणि खरेदीदार शोधण्यात, गरज पोस्ट करण्यात किंवा प्लॅन निवडण्यात मदत करू शकतो. कशी मदत करू?',
  gu: 'નમસ્તે! હું ઓર્ગેનિક ઉત્પાદનો, વેરિફાઇડ વિક્રેતાઓ અને ખરીદદારો શોધવામાં, જરૂરિયાત પોસ્ટ કરવામાં અથવા પ્લાન પસંદ કરવામાં મદદ કરી શકું છું. કેવી રીતે મદદ કરું?',
  kn: 'ನಮಸ್ಕಾರ! ಸಾವಯವ ಉತ್ಪನ್ನಗಳು, ಪರಿಶೀಲಿಸಿದ ಮಾರಾಟಗಾರರು ಮತ್ತು ಖರೀದಿದಾರರನ್ನು ಹುಡುಕಲು, ಅಗತ್ಯವನ್ನು ಪೋಸ್ಟ್ ಮಾಡಲು ಅಥವಾ ಯೋಜನೆ ಆಯ್ಕೆ ಮಾಡಲು ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
  ml: 'നമസ്കാരം! ഓർഗാനിക് ഉൽപ്പന്നങ്ങൾ, പരിശോധിച്ച വിൽപ്പനക്കാർ, വാങ്ങുന്നവർ എന്നിവ കണ്ടെത്താനും ആവശ്യം പോസ്റ്റ് ചെയ്യാനും പ്ലാൻ തിരഞ്ഞെടുക്കാനും ഞാൻ സഹായിക്കാം. എങ്ങനെ സഹായിക്കണം?',
  pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਆਰਗੈਨਿਕ ਉਤਪਾਦ, ਵੈਰੀਫਾਈਡ ਵਿਕਰੇਤਾ ਅਤੇ ਖਰੀਦਦਾਰ ਲੱਭਣ, ਲੋੜ ਪੋਸਟ ਕਰਨ ਜਾਂ ਪਲਾਨ ਚੁਣਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਕਿਵੇਂ ਮਦਦ ਕਰਾਂ?',
  or: 'ନମସ୍କାର! ମୁଁ ଅର୍ଗାନିକ୍ ଉତ୍ପାଦ, ଯାଞ୍ଚିତ ବିକ୍ରେତା ଓ କ୍ରେତା ଖୋଜିବା, ଆବଶ୍ୟକତା ପୋଷ୍ଟ କରିବା କିମ୍ବା ପ୍ଲାନ୍ ବାଛିବାରେ ସାହାଯ୍ୟ କରିପାରିବି। କିପରି ସାହାଯ୍ୟ କରିବି?',
  as: 'নমস্কাৰ! মই অৰ্গানিক সামগ্ৰী, প্ৰমাণিত বিক্ৰেতা আৰু ক্ৰেতা বিচাৰিবলৈ, প্ৰয়োজন পোষ্ট কৰিবলৈ বা প্লেন বাছিবলৈ সহায় কৰিব পাৰোঁ। কেনেকৈ সহায় কৰিম?',
};

export type ChatConfig = {
  enabled: boolean;
  provider: ProviderId;
  model: string;
  key: string; // own key; empty = use the Auto Publisher / environment key for this provider
  botName: string;
  greetings: Record<string, string>;
  color: string;
  position: 'end' | 'start'; // right / left in left-to-right languages
  whatsapp: string; // empty = site WhatsApp number
  handover: { apply: boolean; quote: boolean; unknown: boolean; human: boolean; askContact: boolean };
  maxRepliesPerDay: number;
  maxMessagesPerChat: number;
  deleteAfterDays: number;
  extraRules: string;
};

export const DEFAULT_CHAT: ChatConfig = {
  enabled: false,
  provider: 'gemini',
  model: 'gemini-3.8-flash',
  key: '',
  botName: 'SHRIJAIV assistant',
  greetings: GREETINGS,
  color: '#009A35',
  position: 'end',
  whatsapp: '',
  handover: { apply: true, quote: true, unknown: true, human: true, askContact: true },
  maxRepliesPerDay: 500,
  maxMessagesPerChat: 30,
  deleteAfterDays: 180,
  extraRules: '',
};

const KEY = 'chatbot';

export async function getChatConfig(): Promise<ChatConfig> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    return deepMerge(DEFAULT_CHAT, row ? JSON.parse(row.value) : {});
  } catch {
    return DEFAULT_CHAT;
  }
}

export async function saveChatConfig(incoming: Partial<ChatConfig>): Promise<ChatConfig> {
  const cur = await getChatConfig();
  const next = deepMerge(cur, unmaskSecrets(incoming || {}, cur));
  const n = (v: any, d: number, a: number, b: number) => Math.min(b, Math.max(a, Math.round(Number.isFinite(Number(v)) ? Number(v) : d)));
  next.maxRepliesPerDay = n(next.maxRepliesPerDay, 500, 0, 100000);
  next.maxMessagesPerChat = n(next.maxMessagesPerChat, 30, 2, 200);
  next.deleteAfterDays = n(next.deleteAfterDays, 180, 0, 3650);
  next.color = /^#[0-9a-f]{3,8}$/i.test(next.color) ? next.color : DEFAULT_CHAT.color;
  next.position = next.position === 'start' ? 'start' : 'end';
  next.botName = String(next.botName || DEFAULT_CHAT.botName).slice(0, 60);
  next.extraRules = String(next.extraRules || '').slice(0, 4000);
  next.whatsapp = String(next.whatsapp || '').replace(/[^\d+]/g, '');
  for (const k of Object.keys(next.greetings || {})) next.greetings[k] = String(next.greetings[k] || '').slice(0, 400);
  const value = JSON.stringify(next);
  await prisma.setting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
  return next;
}

export const publicChatConfig = (c: ChatConfig) => maskSecrets(c);

/** What the website widget needs (no secrets) */
export function widgetConfig(c: ChatConfig, locale: string) {
  return { botName: c.botName, greeting: c.greetings?.[locale] || GREETINGS[locale] || c.greetings?.en || GREETINGS.en, color: c.color, position: c.position };
}
