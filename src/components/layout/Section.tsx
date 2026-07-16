import type { ReactNode } from "react";
import { Carrot, Apple, Trash, Recycle, Sprout, Leaf, TreePine, Flower } from "lucide-react";

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
    <section
      className="relative overflow-hidden border-b border-green-200 bg-gradient-to-br from-white via-green-50/30 to-white min-h-[200px] sm:min-h-[240px]"
      data-pagehero-design="default"
    >
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

      {/* Eco-themed decorative elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-green-200/40 to-emerald-300/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-br from-lime-200/30 to-green-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-gradient-to-br from-teal-200/25 to-cyan-300/20 rounded-full blur-2xl -translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-br from-green-100/30 to-emerald-200/25 rounded-full blur-2xl" />

      {/* Vegetable and fruit pattern overlay */}
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='1'%3E%3Cpath d='M20 30c-5 0-8 4-8 9s3 9 8 9 8-4 8-9-3-9-8-9zm0 14c-3 0-5-2-5-5s2-5 5-5 5 2 5 5-2 5-5 5z'/%3E%3Ccircle cx='90' cy='25' r='10'/%3E%3Cpath d='M60 70c0-8-6-14-14-14s-14 6-14 14 6 14 14 14 14-6 14-14-6-14-14-14z'/%3E%3Cpath d='M95 75c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {eyebrow && (
          <span className="inline-block rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-green-700 shadow-sm">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-green-800 via-green-700 to-emerald-600">
          {title}
        </h1>
        {sub && (
          <p className="mt-4 max-w-2xl text-lg text-gray-600 leading-relaxed">
            {sub}
          </p>
        )}
      </div>
    </section>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}
