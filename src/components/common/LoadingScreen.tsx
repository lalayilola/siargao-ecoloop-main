import { useEffect, useState } from "react";
import logo from "@/assets/finalogo.png";

export function LoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Start fade out after loading completes (5s total)
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-700 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
        } animate-white-gradient`}
    >
      <div className="flex flex-col items-center gap-8 px-4" style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)' }}>
        {/* Logo with Bounce Animation */}
        <img 
          src={logo} 
          alt="EcoLoop Siargao" 
          className="h-64 w-64 md:h-72 md:w-72 object-contain"
          style={{
            animation: `logoBounce 5s ease-in-out infinite`,
          }}
        />

        {/* Slide In/Out Text with Infinity Effect */}
        <div 
          className="text-2xl md:text-3xl font-bold tracking-tight uppercase"
          style={{
            fontFamily: "'Libre Baskerville', serif",
            color: '#166534',
            whiteSpace: 'nowrap',
            lineHeight: '1.2',
            display: 'flex',
            gap: '0.2em',
          }}
        >
          {'Siargao Ecoloop'.split('').map((letter, index, array) => {
            const reverseIndex = array.length - 1 - index;
            const isLetterP = letter.toLowerCase() === 'p';
            return (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    animation: isLetterP 
                      ? `letterBounceLeft 5s ease-in-out infinite` 
                      : `letterBounce 5s ease-in-out infinite`,
                    animationDelay: `${index * 0.15}s`,
                  }}
                >
                  {letter === ' ' ? '\u00A0' : letter}
                </span>
                <img 
                  src={logo} 
                  alt="EcoLoop" 
                  className="absolute -right-8 top-0 h-6 w-6 object-contain opacity-0 transition-opacity"
                  style={{
                    animation: `logoShow 5s ease-in-out infinite`,
                    animationDelay: `${reverseIndex * 0.15 + 3.5}s`,
                  }}
                />
              </span>
            );
          })}
        </div>

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

        @keyframes infinityText {
          0% {
            transform: translateX(-100%) scaleX(1) scaleY(1);
            opacity: 0;
          }
          15% {
            transform: translateX(0) scaleX(1) scaleY(1);
            opacity: 1;
          }
          25% {
            transform: translateX(0) scaleX(1.3) scaleY(0.7) rotate(-15deg);
          }
          35% {
            transform: translateX(0) scaleX(1.4) scaleY(0.6) rotate(-20deg);
          }
          45% {
            transform: translateX(0) scaleX(1.3) scaleY(0.7) rotate(-15deg);
          }
          50% {
            transform: translateX(0) scaleX(1) scaleY(1) rotate(0deg);
          }
          55% {
            transform: translateX(0) scaleX(1.3) scaleY(0.7) rotate(15deg);
          }
          65% {
            transform: translateX(0) scaleX(1.4) scaleY(0.6) rotate(20deg);
          }
          75% {
            transform: translateX(0) scaleX(1.3) scaleY(0.7) rotate(15deg);
          }
          85% {
            transform: translateX(0) scaleX(1) scaleY(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateX(100%) scaleX(1) scaleY(1);
            opacity: 0;
          }
        }

        @keyframes letterBounce {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
            filter: blur(0px);
          }
          10% {
            transform: translateY(-30px) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
          20% {
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          30% {
            transform: translateY(-20px) scale(1.05);
            filter: blur(0px);
          }
          40% {
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          50% {
            transform: translateY(-10px) scale(1.02);
            filter: blur(0px);
          }
          60% {
            transform: translateY(0) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
          75% {
            transform: translateY(0) scale(0.9);
            opacity: 0.8;
            filter: blur(2px);
          }
          87.5% {
            transform: translateY(0) scale(0.7);
            opacity: 0.4;
            filter: blur(5px);
          }
          100% {
            transform: translateY(0) scale(0.3);
            opacity: 0;
            filter: blur(10px);
          }
        }

        @keyframes letterBounceLeft {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
            filter: blur(0px);
          }
          10% {
            transform: translateY(-30px) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
          20% {
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          30% {
            transform: translateY(-20px) scale(1.05);
            filter: blur(0px);
          }
          40% {
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          50% {
            transform: translateY(-10px) scale(1.02);
            filter: blur(0px);
          }
          60% {
            transform: translateY(0) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
          75% {
            transform: translateY(0) scale(0.9);
            opacity: 0.8;
            filter: blur(2px);
          }
          87.5% {
            transform: translateY(0) scale(0.7);
            opacity: 0.4;
            filter: blur(5px);
          }
          100% {
            transform: translateY(0) scale(0.3);
            opacity: 0;
            filter: blur(10px);
          }
        }

        @keyframes letterExit {
          0%, 60% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          70% {
            transform: translate(200px, 0) scale(0.85);
            opacity: 0.8;
          }
          85% {
            transform: translate(400px, 0) scale(0.6);
            opacity: 0.4;
          }
          100% {
            transform: translate(600px, 0) scale(0.3);
            opacity: 0;
          }
        }

        @keyframes logoShow {
          0%, 70% {
            opacity: 0;
          }
          75% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
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

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes logoBounce {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
            filter: blur(0px);
          }
          10% {
            transform: translateY(-30px) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
          20% {
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          30% {
            transform: translateY(-20px) scale(1.05);
            filter: blur(0px);
          }
          40% {
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          50% {
            transform: translateY(-10px) scale(1.02);
            filter: blur(0px);
          }
          60% {
            transform: translateY(0) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
          75% {
            transform: translateY(0) scale(0.9);
            opacity: 0.8;
            filter: blur(2px);
          }
          87.5% {
            transform: translateY(0) scale(0.7);
            opacity: 0.4;
            filter: blur(5px);
          }
          100% {
            transform: translateY(0) scale(0.3);
            opacity: 0;
            filter: blur(10px);
          }
        }

        .animate-gradient {
          background: linear-gradient(-45deg, #16A34A, #22C55E, #4ADE80, #86EFAC, #10B981, #16A34A);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }

        .animate-white-gradient {
          background: linear-gradient(-45deg, #ffffff, #f0fdf4, #dcfce7, #bbf7d0, #86efac, #ffffff);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }

        .animate-slide {
          animation: slide 3s ease-in-out infinite;
        }

        .animate-infinity-text {
          animation: infinityText 4s ease-in-out infinite;
        }

        .animate-letter {
          animation: letterBounce 5s ease-in-out infinite;
        }

        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}