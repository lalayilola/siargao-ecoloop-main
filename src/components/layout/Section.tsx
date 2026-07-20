import type { ReactNode } from "react";
import { Carrot, Apple, Trash, Recycle, Sprout, Leaf, TreePine, Flower } from "lucide-react";

export function PremiumHero({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Premium Card with Glassmorphism */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ minHeight: '200px' }}>
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-400 animate-gradient-flow opacity-90">
            <style>{`
              @keyframes gradient-flow {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .animate-gradient-flow {
                background-size: 300% 300%;
                animation: gradient-flow 18s ease infinite;
              }
              @keyframes gradient-border-move {
                0% { background-position: 0% 0%; }
                50% { background-position: 100% 100%; }
                100% { background-position: 0% 0%; }
              }
              .animate-border-flow {
                background-size: 400% 400%;
                animation: gradient-border-move 20s ease infinite;
              }
            `}</style>
          </div>
          
          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-md"></div>
          
          {/* Animated Gradient Border */}
          <div className="absolute inset-0 rounded-3xl p-[3px]">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-400 animate-border-flow opacity-80"></div>
          </div>
          
          {/* Floating eco icons background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <style>{`
              @keyframes floatUp {
                0% { transform: translateY(100vh) rotate(0deg) scale(1); opacity: 0; }
                10% { opacity: 0.06; }
                90% { opacity: 0.06; }
                100% { transform: translateY(-100px) rotate(360deg) scale(1.1); opacity: 0; }
              }
              .eco-float {
                position: absolute;
                animation: floatUp linear infinite;
                pointer-events: none;
                will-change: transform, opacity;
              }
            `}</style>
            
            <span className="eco-float text-green-500/10 text-xl" style={{ left: '5%', animationDuration: '30s', animationDelay: '0s' }}>🍃</span>
            <span className="eco-float text-green-600/8 text-lg" style={{ left: '15%', animationDuration: '34s', animationDelay: '5s' }}>🍃</span>
            <span className="eco-float text-emerald-500/10 text-2xl" style={{ left: '25%', animationDuration: '32s', animationDelay: '10s' }}>🍃</span>
            <span className="eco-float text-green-400/8 text-base" style={{ left: '35%', animationDuration: '36s', animationDelay: '15s' }}>🍃</span>
            <span className="eco-float text-green-500/10 text-xl" style={{ left: '45%', animationDuration: '31s', animationDelay: '3s' }}>🍃</span>
            <span className="eco-float text-emerald-600/8 text-lg" style={{ left: '55%', animationDuration: '33s', animationDelay: '8s' }}>🍃</span>
            <span className="eco-float text-green-500/10 text-2xl" style={{ left: '65%', animationDuration: '35s', animationDelay: '12s' }}>🍃</span>
            <span className="eco-float text-green-400/8 text-base" style={{ left: '75%', animationDuration: '30s', animationDelay: '18s' }}>🍃</span>
            <span className="eco-float text-emerald-500/10 text-xl" style={{ left: '85%', animationDuration: '37s', animationDelay: '2s' }}>🍃</span>
            <span className="eco-float text-green-600/8 text-lg" style={{ left: '95%', animationDuration: '29s', animationDelay: '7s' }}>🍃</span>
            
            <span className="eco-float text-blue-400/10 text-lg" style={{ left: '8%', animationDuration: '27s', animationDelay: '4s' }}>💧</span>
            <span className="eco-float text-cyan-500/8 text-base" style={{ left: '22%', animationDuration: '30s', animationDelay: '9s' }}>💧</span>
            <span className="eco-float text-blue-500/10 text-xl" style={{ left: '38%', animationDuration: '28s', animationDelay: '14s' }}>💧</span>
            <span className="eco-float text-cyan-400/8 text-lg" style={{ left: '52%', animationDuration: '32s', animationDelay: '19s' }}>💧</span>
            <span className="eco-float text-blue-500/10 text-base" style={{ left: '68%', animationDuration: '26s', animationDelay: '1s' }}>💧</span>
            <span className="eco-float text-cyan-500/8 text-xl" style={{ left: '82%', animationDuration: '29s', animationDelay: '6s' }}>💧</span>
            
            <span className="eco-float text-green-600/8 text-xl" style={{ left: '12%', animationDuration: '40s', animationDelay: '6s' }}>♻</span>
            <span className="eco-float text-emerald-500/8 text-lg" style={{ left: '28%', animationDuration: '42s', animationDelay: '13s' }}>♻</span>
            <span className="eco-float text-green-500/8 text-xl" style={{ left: '48%', animationDuration: '41s', animationDelay: '20s' }}>♻</span>
            <span className="eco-float text-emerald-600/8 text-lg" style={{ left: '62%', animationDuration: '39s', animationDelay: '2s' }}>♻</span>
            <span className="eco-float text-green-500/8 text-xl" style={{ left: '78%', animationDuration: '43s', animationDelay: '16s' }}>♻</span>
          </div>

          <div className="relative px-8 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-5xl font-bold text-white sm:text-6xl" style={{ fontFamily: 'Sora, sans-serif' }}>{title}</h1>
              {sub && (
                <p className="mt-4 text-xl text-white/90 sm:text-2xl max-w-3xl" style={{ fontFamily: 'Sora, sans-serif' }}>{sub}</p>
              )}
              {action && (
                <div className="mt-8">
                  {action}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  sub,
  bgImage,
  action,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  bgImage?: string;
  action?: ReactNode;
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

      {/* Floating eco elements animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <style>{`
          @keyframes floatUp {
            0% {
              transform: translateY(100vh) rotate(0deg) scale(1);
              opacity: 0;
            }
            10% {
              opacity: 0.6;
            }
            90% {
              opacity: 0.6;
            }
            100% {
              transform: translateY(-100px) rotate(360deg) scale(1.1);
              opacity: 0;
            }
          }
          .eco-float {
            position: absolute;
            animation: floatUp linear infinite;
            pointer-events: none;
            will-change: transform, opacity;
          }
        `}</style>
        
        {/* Leaves */}
        <span className="eco-float text-green-500/20 text-2xl" style={{ left: '5%', animationDuration: '25s', animationDelay: '0s' }}>🍃</span>
        <span className="eco-float text-green-600/15 text-xl" style={{ left: '15%', animationDuration: '30s', animationDelay: '5s' }}>🍃</span>
        <span className="eco-float text-emerald-500/20 text-3xl" style={{ left: '25%', animationDuration: '28s', animationDelay: '10s' }}>🍃</span>
        <span className="eco-float text-green-400/15 text-lg" style={{ left: '35%', animationDuration: '32s', animationDelay: '15s' }}>🍃</span>
        <span className="eco-float text-green-500/20 text-2xl" style={{ left: '45%', animationDuration: '26s', animationDelay: '3s' }}>🍃</span>
        <span className="eco-float text-emerald-600/15 text-xl" style={{ left: '55%', animationDuration: '29s', animationDelay: '8s' }}>🍃</span>
        <span className="eco-float text-green-500/20 text-3xl" style={{ left: '65%', animationDuration: '31s', animationDelay: '12s' }}>🍃</span>
        <span className="eco-float text-green-400/15 text-lg" style={{ left: '75%', animationDuration: '27s', animationDelay: '18s' }}>🍃</span>
        <span className="eco-float text-emerald-500/20 text-2xl" style={{ left: '85%', animationDuration: '33s', animationDelay: '2s' }}>🍃</span>
        <span className="eco-float text-green-600/15 text-xl" style={{ left: '95%', animationDuration: '24s', animationDelay: '7s' }}>🍃</span>
        
        {/* Water droplets */}
        <span className="eco-float text-blue-400/20 text-xl" style={{ left: '8%', animationDuration: '22s', animationDelay: '4s' }}>💧</span>
        <span className="eco-float text-cyan-500/15 text-lg" style={{ left: '22%', animationDuration: '26s', animationDelay: '9s' }}>💧</span>
        <span className="eco-float text-blue-500/20 text-2xl" style={{ left: '38%', animationDuration: '24s', animationDelay: '14s' }}>💧</span>
        <span className="eco-float text-cyan-400/15 text-xl" style={{ left: '52%', animationDuration: '28s', animationDelay: '19s' }}>💧</span>
        <span className="eco-float text-blue-500/20 text-lg" style={{ left: '68%', animationDuration: '23s', animationDelay: '1s' }}>💧</span>
        <span className="eco-float text-cyan-500/15 text-2xl" style={{ left: '82%', animationDuration: '25s', animationDelay: '6s' }}>💧</span>
        <span className="eco-float text-blue-400/20 text-xl" style={{ left: '92%', animationDuration: '27s', animationDelay: '11s' }}>💧</span>
        
        {/* Recycle symbols */}
        <span className="eco-float text-green-600/15 text-2xl" style={{ left: '12%', animationDuration: '35s', animationDelay: '6s' }}>♻</span>
        <span className="eco-float text-emerald-500/15 text-xl" style={{ left: '28%', animationDuration: '38s', animationDelay: '13s' }}>♻</span>
        <span className="eco-float text-green-500/15 text-2xl" style={{ left: '48%', animationDuration: '36s', animationDelay: '20s' }}>♻</span>
        <span className="eco-float text-emerald-600/15 text-xl" style={{ left: '62%', animationDuration: '34s', animationDelay: '2s' }}>♻</span>
        <span className="eco-float text-green-500/15 text-2xl" style={{ left: '78%', animationDuration: '37s', animationDelay: '16s' }}>♻</span>
        <span className="eco-float text-emerald-500/15 text-xl" style={{ left: '88%', animationDuration: '33s', animationDelay: '9s' }}>♻</span>
      </div>

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
        {action && (
          <div className="mt-6">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}
