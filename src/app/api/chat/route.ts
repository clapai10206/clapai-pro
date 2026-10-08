import { NextResponse } from 'next/server';

const demoResponses = {
  Darija: 'أكيد! غادي نعاونك، ومرحبًا بك في CLAPAI PRO.',
  العربية: 'أكيد! سأساعدك، مرحبًا بك في CLAPAI PRO.',
  EN: 'Absolutely! I can help you with that.',
  FR: 'Bien sûr ! Je peux vous aider avec ça.',
} as const;

function getSystemPrompt(lang: string) {
  if (lang === 'Darija') {
    return 'أنت مساعد ذكي ومهني. رد بالدارجة المغربية بشكل طبيعي ومريح، مختصر لكن مفيد. إذا ما عرفت الجواب، قلها بوضوح وقدم اقتراحات عملية.';
  }

  if (lang === 'العربية') {
    return 'أنت مساعد ذكي ومهني. أجب باللغة العربية الفصحى الواضحة، ولا تستخدم الدارجة المغربية في هذا الوضع. اجعل الإجابة مختصرة ومفيدة، وإذا لم تعرف الإجابة فقل ذلك بوضوح وقدم اقتراحات عملية.';
  }

  if (lang === 'FR') {
    return 'Tu es un assistant utile et professionnel. Réponds en français, clair et naturel, avec un ton professionnel et pratique.';
  }

  return 'You are a helpful professional assistant. Answer clearly, concisely, and practically.';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const lang = typeof body.lang === 'string' ? body.lang : 'EN';

    if (!message) {
      return NextResponse.json(
        { reply: demoResponses[lang as keyof typeof demoResponses] ?? demoResponses.EN },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const xaiApiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    const apiKey = groqApiKey || xaiApiKey;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'AI provider is not configured.',
          reply:
            lang === 'Darija'
              ? 'مفتاح Groq أو xAI مازال ما مضافش. زيدو في ملف .env.local ومن بعد عاود شغل الموقع.'
              : lang === 'العربية'
                ? 'لم تتم إضافة مفتاح Groq أو xAI بعد. أضفه في ملف .env.local ثم أعد تشغيل الموقع.'
                : lang === 'FR'
                  ? 'La clé Groq ou xAI n’est pas configurée. Ajoutez-la dans .env.local puis redémarrez le site.'
                  : 'The Groq or xAI API key is not configured. Add it to .env.local and restart the site.',
        },
        { status: 503 }
      );
    }

    const isGroq = Boolean(groqApiKey);
    const response = await fetch(
      isGroq
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.x.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: isGroq
            ? process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
            : process.env.GROK_MODEL || 'grok-2-latest',
          messages: [
            { role: 'system', content: getSystemPrompt(lang) },
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `AI provider request failed with status ${response.status}.`,
          reply:
            lang === 'Darija'
              ? 'وقع مشكل فالاتصال بخدمة الذكاء الاصطناعي. تأكد من المفتاح واسم النموذج وحاول مرة أخرى.'
              : lang === 'العربية'
                ? 'حدثت مشكلة في الاتصال بخدمة الذكاء الاصطناعي. تحقق من المفتاح واسم النموذج ثم حاول مجددًا.'
                : lang === 'FR'
                  ? 'La connexion au service IA a échoué. Vérifiez la clé et le nom du modèle, puis réessayez.'
                  : 'The AI service request failed. Check the API key and model name, then try again.',
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== 'string' || !reply.trim()) {
      return NextResponse.json(
        { error: 'AI provider returned an empty response.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      {
        error: 'Unexpected server error.',
        reply: 'There was an unexpected server error. Please try again later.',
      },
      { status: 500 }
    );
  }
}
