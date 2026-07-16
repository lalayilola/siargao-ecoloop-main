import { useEffect, useState } from "react";
import logo from "@/assets/finalogo.png";

export function LoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Start fade out after loading completes (3s total)
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-700 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
        } animate-gradient`}
    >
      <div className="flex flex-col items-center gap-8 px-4" style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)' }}>
        {/* Logo */}
        <img src={logo} alt="EcoLoop Siargao" className="h-64 w-64 md:h-72 md:w-72 object-contain" />

        {/* Slide In/Out Text */}
        <h1 
          className="text-2xl md:text-3xl font-bold tracking-tight animate-slide uppercase"
          style={{
            fontFamily: "'Libre Baskerville', serif",
            color: '#166534',
            whiteSpace: 'nowrap',
            lineHeight: '1.2',
          }}
        >
          Siargao Ecoloop
        </h1>

        {/* Simple Loading Dots */}
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-3 w-3 bg-green-500 rounded-full"
              style={{
                animation: `pulse 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap');

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes slide {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            transform: translateX(0);
            opacity: 1;
          }
          90% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .animate-gradient {
          background: linear-gradient(-45deg, #16A34A, #22C55E, #4ADE80, #86EFAC, #10B981, #16A34A);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }

        .animate-slide {
          animation: slide 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}