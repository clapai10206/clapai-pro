import { NextResponse } from 'next/server';

const systemPrompt =
  "You are ClapAI Pro, a helpful, knowledgeable, and friendly assistant. Help users with any topic or question across everyday life, learning, work, technology, food, and more. Be accurate, clear, practical, and honest about uncertainty. Do not limit yourself to food ordering.\n\nLANGUAGE RULE - VERY IMPORTANT:\n- Detect the language the user writes in and reply in that same language.\n- If the user writes in Moroccan Darija using Arabic letters, reply in Moroccan Darija using Arabic letters.\n- If the user writes in French, reply in French.\n- If the user writes in English, reply in English.\n- If the user writes Darija in Latin characters (for example, \"bghit tajine\"), reply in Moroccan Darija using Arabic letters.\n- For any other language, reply in that language.\n\nKeep answers friendly and appropriate to the request. Be concise when a short answer is enough, and provide more detail when useful.";

const darijaError =
  'سمح ليا، وقع مشكل فالاتصال بخدمة الذكاء الاصطناعي. عاود حاول من بعد.';

function requestGroq(apiKey: string, message: string, model: string) {
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });
}

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'الطلب ما مفهومش. عاود صيفطو بصيغة صحيحة.', reply: 'الطلب ما مفهومش. عاود صيفطو بصيغة صحيحة.' },
      { status: 400 }
    );
  }

  const message =
    typeof body === 'object' && body !== null && 'message' in body &&
    typeof body.message === 'string'
      ? body.message.trim()
      : '';

  if (!message) {
    return NextResponse.json(
      { error: 'كتب ليا شنو بغيتي تسول.', reply: 'كتب ليا شنو بغيتي تسول.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'GROQ_API_KEY ما متضبطش فإعدادات الخادم.',
        reply: 'مفتاح Groq ما متضبطش دابا. زيد GROQ_API_KEY فملف .env.local وعاود شغل الموقع.',
      },
      { status: 503 }
    );
  }

  try {
    let response = await requestGroq(apiKey, message, 'llama-3.3-70b-versatile');

    if (response.status === 404) {
      response = await requestGroq(apiKey, message, 'qwen/qwen3.8-27b');
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Groq API رجع الحالة ${response.status}.`,
          reply: darijaError,
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== 'string' || !reply.trim()) {
      return NextResponse.json(
        { error: 'Groq API ما رجع حتى جواب.', reply: darijaError },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: 'ما قدرناش نتاصلو بخدمة Groq.', reply: darijaError },
      { status: 502 }
    );
  }
}
