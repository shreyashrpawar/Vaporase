import { notFound } from 'next/navigation';
import { DOCS_ARTICLES } from '@/data/docsData';
import Link from 'next/link';
import { ChevronRight, ArrowRight, HelpCircle, Lock } from 'lucide-react';
import type { Metadata } from 'next';

interface Params {
  slug: string;
}

export async function generateStaticParams() {
  return DOCS_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = DOCS_ARTICLES.find((a) => a.slug === slug);
  if (!article) return {};
  
  return {
    title: `${article.title} | Ilusion Guides`,
    description: article.description,
    keywords: article.seoKeywords,
    openGraph: {
      title: `${article.title} | Ilusion Guides`,
      description: article.description,
      type: 'article',
    }
  };
}

export default async function DocArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const articleIndex = DOCS_ARTICLES.findIndex((a) => a.slug === slug);
  if (articleIndex === -1) {
    notFound();
  }

  const article = DOCS_ARTICLES[articleIndex];
  
  // Next article calculation for bottom navigation
  const nextArticle = articleIndex < DOCS_ARTICLES.length - 1 ? DOCS_ARTICLES[articleIndex + 1] : null;

  return (
    <article className="space-y-10 animate-fade-in">
      {/* Dynamic FAQPage Schema for Search & AI Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": article.sections.map((section) => ({
              "@type": "Question",
              "name": section.title,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": section.content
              }
            }))
          })
        }}
      />
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#534d5e] dark:text-[#a5a1ad]">{article.category}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-bold truncate max-w-[200px]">{article.shortTitle}</span>
      </nav>

      {/* Main Header */}
      <div className="space-y-4 border-b border-border/60 pb-8">
        <span className="badge badge-accent">{article.category}</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {article.title}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {article.description}
        </p>
      </div>

      {/* Body Content */}
      <div className="space-y-10">
        {article.sections.map((section, idx) => (
          <section key={idx} className="space-y-3.5">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              {section.title}
            </h2>
            <div className="text-sm sm:text-base text-muted-foreground leading-relaxed space-y-4 whitespace-pre-line">
              {section.content}
            </div>
          </section>
        ))}
      </div>

      {/* Was this helpful? Widget */}
      <div className="p-6 rounded-2xl border border-border bg-background/50 flex flex-col sm:flex-row items-center justify-between gap-4 mt-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/5 flex items-center justify-center border border-accent/10">
            <HelpCircle className="w-4.5 h-4.5 text-accent" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Was this guide helpful?</p>
            <p className="text-[10px] text-muted-foreground">Help us improve our zero-knowledge resources.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:border-accent hover:text-accent transition-all">
            Yes
          </button>
          <button className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:border-accent hover:text-accent transition-all">
            No
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-8 border-t border-border/60 mt-12">
        <div>
          {articleIndex > 0 && (
            <Link 
              href={`/docs/${DOCS_ARTICLES[articleIndex - 1].slug}`}
              className="group flex flex-col items-start gap-1"
            >
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Previous</span>
              <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                {DOCS_ARTICLES[articleIndex - 1].shortTitle}
              </span>
            </Link>
          )}
        </div>
        <div>
          {nextArticle ? (
            <Link 
              href={`/docs/${nextArticle.slug}`}
              className="group flex flex-col items-end gap-1"
            >
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Next Up</span>
              <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
                {nextArticle.shortTitle}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ) : (
            <Link 
              href="/docs/api"
              className="group flex flex-col items-end gap-1"
            >
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Next Up</span>
              <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
                Developer API
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          )}
        </div>
      </div>

    </article>
  );
}
