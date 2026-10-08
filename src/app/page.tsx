'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PaymentMethodLogo } from '@/components/payment-method-logo';

type Message = {
  side: 'user' | 'ai';
  text: string;
};

const languages = ['Darija', 'العربية', 'EN', 'FR'] as const;
type Language = (typeof languages)[number];

type PaymentMethod = {
  id: string;
  label: string;
  logo: string;
  icon: string;
  mode: 'manual' | 'gateway';
  instructions: string;
  whatsapp: string;
};

const featureCards = [
  {
    icon: '◔',
    title: {
      Darija: 'فهم دقيق للدارجة',
      العربية: 'فهم دقيق للدارجة',
      EN: 'Natural Darija Understanding',
      FR: 'Compréhension naturelle du darija',
    },
    description: {
      Darija:
        'يفهم اللهجات المغربية، والتبديل بين اللغات، والتعابير المحلية من الدار البيضاء إلى مراكش.',
      العربية:
        'يفهم اللهجات المغربية، والتبديل بين اللغات، والتعابير المحلية من الدار البيضاء إلى مراكش.',
      EN:
        'Understands Moroccan slang, code-switching, and regional expressions from Casablanca to Marrakech.',
      FR:
        'Comprend le dialecte marocain, le mélange des langues et les expressions locales du grand Maroc.',
    },
  },
  {
    icon: '◍',
    title: {
      Darija: 'صوت ونص',
      العربية: 'صوت ونص',
      EN: 'Voice & Text',
      FR: 'Voix et texte',
    },
    description: {
      Darija: 'تحدث أو اكتب بشكل طبيعي. استقبل ردود سريعة بنبرة إنسانية مع السياق الثقافي.',
      العربية: 'تحدث أو اكتب بشكل طبيعي. استقبل ردود سريعة بنبرة إنسانية مع السياق الثقافي.',
      EN: 'Speak or type naturally. Get instant replies with a human-like tone and cultural context.',
      FR: 'Parlez ou tapez naturellement. Recevez des réponses instantanées avec un ton humain et un contexte culturel.',
    },
  },
  {
    icon: '✓',
    title: {
      Darija: 'خصوصية وآمنة',
      العربية: 'خصوصية وآمنة',
      EN: 'Private & Secure',
      FR: 'Privé et sécurisé',
    },
    description: {
      Darija: 'بياناتك تبقى آمنة. تم بناء الخدمة مع احترام الخصوصية واستضافة محلية في المغرب.',
      العربية: 'بياناتك تبقى آمنة. تم بناء الخدمة مع احترام الخصوصية واستضافة محلية في المغرب.',
      EN: 'Your data stays secure. Built with privacy in mind and hosted locally in Morocco.',
      FR: 'Vos données restent sécurisées. Conçu pour la confidentialité et hébergé localement au Maroc.',
    },
  },
] as const;

const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '0 MAD',
    period: '/month',
    featured: false,
    features: [
      'Up to 100 messages/mo',
      'Darija text chat',
      'Basic support',
      'Community access',
    ],
    button: 'Get started',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '99 MAD',
    period: '/month',
    featured: true,
    features: [
      'Up to 5,000 messages/mo',
      'Voice + Text in Darija',
      'Priority support',
      'Custom prompts & memory',
      'API access',
    ],
    button: 'Start Pro Trial',
  },
  {
    id: 'business',
    name: 'Business',
    price: '199 MAD',
    period: '/month',
    featured: false,
    features: [
      'Unlimited messages',
      'Team workspace',
      'Advanced analytics',
      'Dedicated account manager',
      'SSO & admin controls',
    ],
    button: 'Contact Sales',
  },
] as const;

const translations: Record<Language, {
  login: string;
  getStarted: string;
  heroTitleLineOne: string;
  heroTitleLineTwo: string;
  heroSubtitle: string;
  startFree: string;
  seeHow: string;
  promo: string;
  inputPlaceholder: string;
  sectionTitle: string;
  sectionText: string;
  planBadge: string;
  footer: string;
}> = {
  Darija: {
    login: 'دخول',
    getStarted: 'ابدأ الآن',
    heroTitleLineOne: 'أول AI يتكلم',
    heroTitleLineTwo: 'الدارجة المغربية',
    heroSubtitle:
      'مساعد ذكي مصمم للمغرب. تواصل وتحدث بالطبيعة بالدارجة، وفهم اللهجات والثقافة والسياق المحلي.',
    startFree: 'ابدأ مجانًا',
    seeHow: 'شوف كيفاش كيتشغل',
    promo: 'مصنوع في المغرب • ما كاينش كارت • مجاني 14 يوم',
    inputPlaceholder: 'اسأل بالدارجة...',
    sectionTitle: 'بني للدارجة، بني لك',
    sectionText: 'قدرات قوية مصممة للدارجة المغربية، مستضافة محليًا وتخدم الخصوصية.',
    planBadge: 'الأكثر طلبًا',
    footer: '© 2024 CLAPAI PRO • مصنوع في المغرب • الخصوصية • الشروط • تواصل',
  },
  العربية: {
    login: 'تسجيل الدخول',
    getStarted: 'ابدأ الآن',
    heroTitleLineOne: 'أول AI يتكلم',
    heroTitleLineTwo: 'اللهجة المغربية',
    heroSubtitle:
      'مساعد ذكي مصمم للمغرب. تحدث بطبيعية في اللهجة المغربية وفهم اللهجات والثقافة والسياق المحلي.',
    startFree: 'ابدأ مجانًا',
    seeHow: 'شاهد كيف يعمل',
    promo: 'مصنوع في المغرب • لا يلزم بطاقة • مجاني لمدة 14 يومًا',
    inputPlaceholder: 'اسأل باللهجة المغربية...',
    sectionTitle: 'مصمم للدارجة، ومصمم لك',
    sectionText: 'قدرات قوية مصممة للعربية المغربية، مستضافة محليًا وخصوصية أولًا.',
    planBadge: 'الأكثر شعبية',
    footer: '© 2024 CLAPAI PRO • مصنوع في المغرب • الخصوصية • الشروط • التواصل',
  },
  EN: {
    login: 'Log in',
    getStarted: 'Get Started',
    heroTitleLineOne: 'The first AI that speaks',
    heroTitleLineTwo: 'Moroccan Darija',
    heroSubtitle:
      'An AI assistant built for Morocco. Chat and talk naturally in Darija — understand local slang, culture, and context.',
    startFree: 'Start Free',
    seeHow: 'See how it works',
    promo: 'Made in Morocco • No credit card required • Free for 14 days',
    inputPlaceholder: 'Ask in Darija...',
    sectionTitle: 'Built for Darija, built for you',
    sectionText: 'Powerful capabilities designed for Moroccan Arabic, locally hosted and privacy-first.',
    planBadge: 'Most popular',
    footer: '© 2024 CLAPAI PRO • Made in Morocco • Privacy • Terms • Contact',
  },
  FR: {
    login: 'Connexion',
    getStarted: 'Commencer',
    heroTitleLineOne: 'Le premier IA qui parle',
    heroTitleLineTwo: 'le darija marocain',
    heroSubtitle:
      'Un assistant IA conçu pour le Maroc. Discutez naturellement en darija et comprenez le contexte local.',
    startFree: 'Commencer gratuitement',
    seeHow: 'Voir comment ça marche',
    promo: 'Fabriqué au Maroc • Sans carte • Gratuit 14 jours',
    inputPlaceholder: 'Demandez en darija...',
    sectionTitle: 'Conçu pour le darija, pour vous',
    sectionText:
      'Des fonctionnalités puissantes pour l’arabe marocain, hébergées localement et axées sur la confidentialité.',
    planBadge: 'Le plus populaire',
    footer: '© 2024 CLAPAI PRO • Fabriqué au Maroc • Confidentialité • Conditions • Contact',
  },
};

function getLocalizedPlanName(planName: string, language: Language) {
  if (planName === 'Free') {
    return language === 'Darija' || language === 'العربية' ? 'مجانًا' : 'Free';
  }

  if (planName === 'Pro') {
    return 'Pro';
  }

  return language === 'Darija' || language === 'العربية' ? 'شركة' : 'Business';
}

function getLocalizedPlanButton(label: string, language: Language) {
  if (label === 'Get started') {
    return language === 'Darija' || language === 'العربية' ? 'ابدأ الآن' : 'Get started';
  }
  if (label === 'Start Pro Trial') {
    return language === 'Darija' || language === 'العربية' ? 'ابدأ تجربة Pro' : 'Start Pro Trial';
  }
  return language === 'Darija' || language === 'العربية' ? 'تواصل مع المبيعات' : 'Contact Sales';
}

function getLocalizedFeatureText(featureTitle: string, language: Language) {
  const featureMap: Record<string, Record<Language, string>> = {
    'Natural Darija Understanding': {
      Darija: 'فهم دقيق للدارجة',
      العربية: 'فهم دقيق للدارجة',
      EN: 'Natural Darija Understanding',
      FR: 'Compréhension naturelle du darija',
    },
    'Voice & Text': {
      Darija: 'صوت ونص',
      العربية: 'صوت ونص',
      EN: 'Voice & Text',
      FR: 'Voix et texte',
    },
    'Private & Secure': {
      Darija: 'خصوصية وآمنة',
      العربية: 'خصوصية وآمنة',
      EN: 'Private & Secure',
      FR: 'Privé et sécurisé',
    },
  };

  return featureMap[featureTitle]?.[language] ?? featureTitle;
}

export default function Page() {
  const [lang, setLang] = useState<Language>('Darija');
  const [query, setQuery] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalError, setPaymentModalError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const content = useMemo(() => translations[lang], [lang]);

  useEffect(() => {
    fetch('/api/public-config', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load public settings.');
        const data = await response.json();
        const activeMethods = data.paymentMethods as PaymentMethod[];
        setPaymentMethods(activeMethods);
        setSelectedPaymentMethod(activeMethods[0]?.id ?? '');
      })
      .catch(() => setPaymentMethods([]));
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSend = async () => {
    const trimmed = query.trim();
    if (!trimmed || isSending) return;

    setMessages((current) => [...current, { side: 'user', text: trimmed }]);
    setQuery('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, lang }),
      });

      const data = await response.json();
      const reply = data.reply || 'I can help with that.';
      setMessages((current) => [...current, { side: 'ai', text: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          side: 'ai',
          text:
            lang === 'Darija' || lang === 'العربية'
              ? 'واجهت مشكلة في الاتصال بالخادم. حاول مرة أخرى.'
              : 'There was a problem connecting to the server. Please try again.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckout = async (planId: string) => {
    const selectedMethod = paymentMethods.find((method) => method.id === selectedPaymentMethod);
    setPaymentModalError('');
    if (!selectedMethod || planId === 'business' || selectedMethod.mode === 'manual') {
      setShowPaymentModal(Boolean(selectedMethod));
      return;
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          paymentMethod: selectedPaymentMethod,
          lang,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      if (data.success) {
        setPaymentModalError(data.message || 'تم إعداد الطلب، تواصل مع الفريق لإكمال الأداء.');
        setShowPaymentModal(true);
        return;
      }

      setPaymentModalError(data.message || 'تعذر بدء الأداء دابا. عاود المحاولة.');
      setShowPaymentModal(true);
    } catch (cause) {
      console.error('Checkout request failed:', cause);
      setPaymentModalError('وقع مشكل فبدء الأداء. عاود المحاولة من بعد.');
      setShowPaymentModal(true);
    }
  };

  const selectedMethod = paymentMethods.find((method) => method.id === selectedPaymentMethod);

  const localizedPricingPlans = pricingPlans.map((plan) => ({
    ...plan,
    name: getLocalizedPlanName(plan.name, lang),
    button: getLocalizedPlanButton(plan.button, lang),
    features:
      lang === 'Darija' || lang === 'العربية'
        ? plan.features.map((item) => {
            if (item === 'Up to 100 messages/mo') return 'حتى 100 رسالة/شهر';
            if (item === 'Darija text chat') return 'دردشة نصية بالدارجة';
            if (item === 'Basic support') return 'دعم أساسي';
            if (item === 'Community access') return 'وصول إلى المجتمع';
            if (item === 'Up to 5,000 messages/mo') return 'حتى 5000 رسالة/شهر';
            if (item === 'Voice + Text in Darija') return 'صوت + نص بالدارجة';
            if (item === 'Priority support') return 'دعم أولوي';
            if (item === 'Custom prompts & memory') return 'موجهات مخصصة وذاكرة';
            if (item === 'API access') return 'وصول إلى API';
            if (item === 'Unlimited messages') return 'رسائل غير محدودة';
            if (item === 'Team workspace') return 'مساحة فريق';
            if (item === 'Advanced analytics') return 'تحليلات متقدمة';
            if (item === 'Dedicated account manager') return 'مدير حساب مخصص';
            return 'SSO ومراقبة الإدارة';
          })
        : plan.features,
  }));

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#1d1d1f]">
      <div className="mx-auto max-w-[1280px] px-5 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#7c3aed] text-xl shadow-[0_10px_18px_rgba(124,58,237,0.2)]">
              <span aria-hidden="true">◉</span>
            </div>
            <div className="text-[30px] font-black tracking-[-0.06em]">CLAPAI PRO</div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 rounded-full bg-[#f0f0f0] p-1 shadow-inner">
              {languages.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLang(item)}
                  className={`rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
                    lang === item
                      ? 'bg-[#7c3aed] text-white shadow-[0_8px_16px_rgba(124,58,237,0.2)]'
                      : 'bg-[#4a4a4d] text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <Link
              href="/admin"
              className="rounded-full border border-[#1d1d1f] bg-white px-4 py-2 text-sm font-bold text-[#1d1d1f] shadow-sm"
            >
              {content.login}
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection('pricing')}
              className="rounded-full bg-[#7c3aed] px-4 py-2 text-sm font-bold text-white shadow-[0_10px_18px_rgba(124,58,237,0.25)]"
            >
              {content.getStarted}
            </button>
          </div>
        </header>

        <main className="pt-8">
          <section className="grid items-center gap-8 lg:grid-cols-[1.03fr_0.97fr]">
            <div className="pt-3">
              <h1 className="text-[62px] font-black leading-[0.88] tracking-[-0.07em] text-[#1d1d1f] sm:text-[72px] lg:text-[82px]">
                {content.heroTitleLineOne}
                <span className="mt-2 block text-[#6d2ee6]">{content.heroTitleLineTwo}</span>
              </h1>

              <p className="mt-6 max-w-[640px] text-[15px] leading-7 text-[#5c5c60] sm:text-[17px]">
                {content.heroSubtitle}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => scrollToSection('pricing')}
                  className="rounded-full bg-[#7c3aed] px-6 py-4 text-[17px] font-bold text-white shadow-[0_12px_24px_rgba(124,58,237,0.28)]"
                >
                  {content.startFree} <span aria-hidden="true">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('features')}
                  className="flex items-center gap-3 rounded-full border border-[#1d1d1f] bg-white px-5 py-3 text-[15px] font-bold text-[#1d1d1f] shadow-sm"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-[#1d1d1f] bg-white text-[13px]">
                    ◉
                  </span>
                  {content.seeHow}
                </button>
              </div>

              <p className="mt-5 text-[12px] text-[#5f5f63]">{content.promo}</p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[560px] overflow-hidden rounded-[28px] border border-[#ececef] bg-[#f6f5f8] shadow-[0_36px_60px_rgba(30,22,42,0.12)]">
                <div className="flex items-center justify-between border-b border-[#2f273d] bg-[#1b1225] px-4 py-3 text-white">
                  <div className="flex items-center gap-2 text-[12px] font-bold tracking-[0.12em] text-[#e7d8ff] uppercase">
                    <span className="text-[14px]">◉</span>
                    CLAPAI PRO • Chat
                  </div>
                  <div className="flex items-center gap-2 text-xl text-[#d0d0d5]">
                    <span>•</span>
                    <span>•</span>
                    <span>•</span>
                  </div>
                </div>

                <div className="space-y-4 bg-[#f5f3f7] p-4 pb-2">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.side}-${index}`}
                      className={message.side === 'user' ? 'flex justify-end' : 'flex justify-start'}
                    >
                      <div
                        className={
                          message.side === 'user'
                            ? 'max-w-[85%] rounded-[18px] rounded-br-[6px] bg-[#d9c8f7] px-3 py-2 text-right text-[14px] leading-6 text-[#1d1d1f]'
                            : 'max-w-[85%] rounded-[18px] rounded-bl-[6px] bg-[#e7d7ff] px-3 py-2 text-[14px] leading-6 text-[#1d1d1f]'
                        }
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 bg-[#f5f3f7] p-4 pt-2">
                  <div className="flex flex-1 items-center gap-3 rounded-[18px] border border-[#1d1d1f] bg-white px-3 py-3 shadow-sm">
                    <button type="button" className="grid h-7 w-7 place-items-center rounded-full bg-[#f3edff] text-[#6d2ee6]">
                      ◌
                    </button>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleSend();
                      }}
                      placeholder={content.inputPlaceholder}
                      className="w-full border-none bg-transparent text-[15px] text-[#5b5b60] outline-none placeholder:text-[#7a7a7d]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending}
                    className="grid h-12 w-12 place-items-center rounded-full bg-[#7c3aed] text-xl text-white shadow-[0_14px_20px_rgba(124,58,237,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSending ? '…' : '➤'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="mt-20">
            <div className="text-center">
              <h2 className="text-[26px] font-black leading-tight tracking-[-0.05em] text-[#1d1d1f] sm:text-[34px]">
                {content.sectionTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-[720px] text-[15px] text-[#5b5b60] sm:text-[18px]">
                {content.sectionText}
              </p>
            </div>

            <div className="mt-9 grid gap-6 md:grid-cols-3">
              {featureCards.map((feature) => (
                <div key={feature.title.EN} className="rounded-[18px] border border-[#e2e2e7] bg-[#f2f2f4] p-6">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-[12px] border border-[#d5c4f7] bg-[#f1eaff] text-xl text-[#6d2ee6]">
                    {feature.icon}
                  </div>
                  <h3 className="text-[20px] font-black leading-snug tracking-[-0.04em] text-[#1d1d1f]">
                    {getLocalizedFeatureText(feature.title.EN, lang)}
                  </h3>
                  <p className="mt-3 text-[15px] leading-6 text-[#5c5c60]">
                    {feature.description[lang]}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="pricing" className="mt-16">
            <div className="grid gap-6 md:grid-cols-3">
              {localizedPricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={
                    plan.featured
                      ? 'rounded-[26px] border border-[#0f0f14] bg-[#1b1225] p-6 text-white shadow-[0_20px_30px_rgba(20,14,31,0.18)]'
                      : 'rounded-[26px] border border-[#e4e4e7] bg-[#f5f5f6] p-6 text-[#1d1d1f]'
                  }
                >
                  <div className="mb-5 flex items-center justify-between gap-2">
                    <h3 className="text-[22px] font-black tracking-[-0.04em]">{plan.name}</h3>
                    {plan.featured && (
                      <span className="rounded-full bg-[#7c3aed] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em]">
                        {content.planBadge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-end gap-1 pb-3">
                    <span className={`text-[30px] font-black tracking-[-0.05em] ${plan.featured ? 'text-white' : 'text-[#1d1d1f]'}`}>
                      {plan.price.replace(' MAD', '')}
                    </span>
                    <span className={`pb-1 text-[13px] ${plan.featured ? 'text-[#d8d1de]' : 'text-[#5c5c60]'}`}>
                      {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-3 pt-4 text-[14px] leading-6">
                    {plan.features.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className={`mt-1 text-sm ${plan.featured ? 'text-[#b59df3]' : 'text-[#7c3aed]'}`}>
                          ✓
                        </span>
                        <span className={plan.featured ? 'text-[#efedf5]' : 'text-[#2d2d30]'}>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.id !== 'free' && paymentMethods.length > 0 && (
                    <div className="mt-5">
                      <p className={`mb-2 text-xs font-semibold ${plan.featured ? 'text-[#d8d1de]' : 'text-[#5c5c60]'}`}>
                        {lang === 'EN' ? 'Choose a payment method' : lang === 'FR' ? 'Choisissez un moyen de paiement' : 'اختار وسيلة الدفع'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {paymentMethods.map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            aria-label={method.label}
                            aria-pressed={selectedPaymentMethod === method.id}
                            title={method.label}
                            onClick={() => {
                              setSelectedPaymentMethod(method.id);
                              setPaymentModalError('');
                              setShowPaymentModal(true);
                            }}
                            className={
                              selectedPaymentMethod === method.id
                                ? plan.featured
                                  ? 'rounded-full border border-[#c9b4ff] bg-[#7c3aed] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white'
                                  : 'rounded-full border border-[#7c3aed] bg-[#efe7ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#4b1ea8]'
                                : plan.featured
                                  ? 'rounded-full border border-[#3a2d49] bg-[#241a2f] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#d7d0e1]'
                                  : 'rounded-full border border-[#d9d9dd] bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#36363a]'
                            }
                          >
                            <PaymentMethodLogo
                              id={method.id}
                              label={method.label}
                              logo={method.logo}
                              icon={method.icon}
                              className={method.id === 'cash-plus' ? 'h-5 w-5' : method.id === 'bank-transfer' || method.id === 'cash-on-delivery' ? 'h-5 w-7' : 'h-4 w-16'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCheckout(plan.id)}
                    className={
                      plan.featured
                        ? 'mt-4 w-full rounded-full bg-[#7c3aed] px-4 py-3 text-[15px] font-bold text-white shadow-[0_10px_18px_rgba(124,58,237,0.25)]'
                        : 'mt-4 w-full rounded-full border border-[#d7d7db] bg-white px-4 py-3 text-[15px] font-bold text-[#1d1d1f]'
                    }
                  >
                    {plan.button}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="mt-16 border-t border-transparent pt-8 text-center text-[12px] text-[#4c4c52]">
          {content.footer}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method.id}
                className="flex h-9 min-w-12 items-center justify-center rounded-full border border-[#e2d9ef] bg-white px-3 py-1.5"
                aria-label={`وسيلة الدفع: ${method.label}`}
                title={method.label}
              >
                <PaymentMethodLogo
                  id={method.id}
                  label={method.label}
                  logo={method.logo}
                  icon={method.icon}
                  className={method.id === 'cash-plus' ? 'h-5 w-5' : method.id === 'bank-transfer' || method.id === 'cash-on-delivery' ? 'h-5 w-7' : 'h-4 w-16'}
                />
              </span>
            ))}
          </div>
          <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] font-semibold">
            {[
              { slug: 'about', label: 'من نحن' },
              { slug: 'privacy', label: 'سياسة الخصوصية' },
              { slug: 'terms', label: 'شروط الاستخدام' },
              { slug: 'contact', label: 'اتصل بنا' },
            ].map((page) => (
              <a key={page.slug} href={`/pages/${page.slug}`} className="text-[#6d2ee6] hover:underline">
                {page.label}
              </a>
            ))}
          </nav>
        </footer>
      </div>
      {showPaymentModal && selectedMethod && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowPaymentModal(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            className="w-full max-w-md rounded-[26px] border border-[#e7e2ec] bg-white p-6 text-right shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:p-8"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <PaymentMethodLogo
                id={selectedMethod.id}
                label={selectedMethod.label}
                logo={selectedMethod.logo}
                icon={selectedMethod.icon}
                className="h-10 w-20"
              />
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setShowPaymentModal(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f1f5] text-lg font-bold text-[#4b4651]"
              >
                ×
              </button>
            </div>
            <h2 id="payment-modal-title" className="text-xl font-black text-[#1d1d1f]">
              طريقة الأداء: {selectedMethod.label}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#5c5c60]">تواصل مع الفريق لإكمال الأداء</p>
            {selectedMethod.instructions && (
              <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#f7f5fa] p-4 text-sm leading-6 text-[#37323d]">
                {selectedMethod.instructions}
              </p>
            )}
            {paymentModalError && (
              <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {paymentModalError}
              </p>
            )}
            <a
              href={`https://wa.me/${selectedMethod.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`السلام عليكم، بغيت نكمل الأداء عبر ${selectedMethod.label}`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex w-full items-center justify-center rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1fb85a]"
            >
              تواصل عبر واتساب
            </a>
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="mt-4 w-full text-sm font-bold text-[#6d2ee6] hover:underline"
            >
              👉 اختيار وسيلة دفع أخرى
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
