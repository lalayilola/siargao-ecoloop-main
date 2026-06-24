import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  sub,
  bgImage,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  bgImage?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-primary/20 bg-transparent min-h-[420px] sm:min-h-[520px]">
      {bgImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-primary/15" />
      <div className="absolute left-[-4rem] top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute right-[-3rem] top-28 h-36 w-36 rounded-full bg-secondary/30 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        {eyebrow && (
          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary shadow-sm shadow-primary/10">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-6 max-w-3xl text-4xl font-display font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {title}
        </h1>
        {sub && (
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
            {sub}
          </p>
        )}
        <div className="mt-10 rounded-[2rem] border border-primary/15 bg-white/85 p-6 shadow-[0_28px_80px_-48px_rgba(16,49,71,0.3)] backdrop-blur-sm sm:p-8">
          <p className="text-slate-700/90">
            Welcome to EcoLoop — a grounded community for Siargao farmers, restaurants, locals, and LGU partners. Share resources, connect, and grow together in a greener interface.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}
