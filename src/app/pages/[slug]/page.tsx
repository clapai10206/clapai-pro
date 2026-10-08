'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ContentPage = {
  slug: string;
  title: string;
  content: string;
};

export default function ContentPageView({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState('');
  const [page, setPage] = useState<ContentPage | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    params.then(({ slug: pageSlug }) => {
      if (!active) return;
      setSlug(pageSlug);
      fetch('/api/public-config', { cache: 'no-store' })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error('Unable to load page');
          const found = data.pages.find((item: ContentPage) => item.slug === pageSlug);
          if (active) setPage(found ?? null);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    });
    return () => {
      active = false;
    };
  }, [params]);

  return (
    <main className="min-h-screen bg-[#f7f7f7] px-5 py-8 text-[#1d1d1f] sm:px-8">
      <article className="mx-auto max-w-3xl rounded-[26px] border border-[#e7e2ec] bg-white p-6 shadow-[0_24px_55px_rgba(40,24,60,0.08)] sm:p-10">
        <Link href="/" className="text-sm font-bold text-[#6d2ee6]">← الرجوع للموقع</Link>
        {page ? (
          <>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-[#7c3aed]">CLAPAI PRO</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{page.title}</h1>
            <div className="mt-6 whitespace-pre-wrap break-words text-[15px] leading-8 text-[#55515b]">
              {page.content}
            </div>
          </>
        ) : (
          <p className="mt-8 text-[#55515b]">
            {failed ? 'تعذر تحميل الصفحة.' : slug ? 'الصفحة غير موجودة.' : 'جاري تحميل الصفحة...'}
          </p>
        )}
      </article>
    </main>
  );
}
