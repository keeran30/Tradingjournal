"use client";

export default function AppLoader({ message = "Loading" }: { message?: string }) {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center relative">
        {/* Trading Candle Animation */}
        <div className="relative w-24 h-36 mx-auto mb-8">
          {/* Outer glow ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: "1.5s" }} />
          </div>
          
          {/* Candle Wick */}
          <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-full bg-gradient-to-b from-zinc-500 via-zinc-400 to-zinc-500 rounded-full animate-flicker" />
          
          {/* Candle Body - Rising */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 bottom-6 w-10 bg-gradient-to-b from-emerald-600 to-emerald-400 rounded-sm shadow-xl shadow-emerald-500/40"
            style={{
              animation: "candleRiseGlobal 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
            }}
          />
          
          {/* Bottom glow */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 w-16 h-6 bg-emerald-500/30 blur-2xl rounded-full animate-pulse" />
          
          {/* Sparkle particles */}
          <div className="absolute left-1/2 -translate-x-1/2 top-4 w-1 h-1 bg-emerald-300 rounded-full animate-sparkle1" />
          <div className="absolute left-1/2 -translate-x-1/2 top-8 w-1.5 h-1.5 bg-emerald-200 rounded-full animate-sparkle2" />
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-0.5 h-0.5 bg-emerald-100 rounded-full animate-sparkle3" />
        </div>

        {/* App Title */}
        <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
          TradeVault
        </h2>

        {/* Loading Message */}
        <p className="text-zinc-400 text-base font-light tracking-wider animate-pulse">
          {message}
        </p>
        <p className="text-zinc-600 text-xs mt-2 font-light">
          Preparing your trading experience
        </p>

        {/* Progress Dots */}
        <div className="flex gap-2.5 justify-center mt-5">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>

        {/* Custom Keyframes */}
        <style jsx>{`
          @keyframes candleRiseGlobal {
            0% {
              height: 0%;
              opacity: 0;
              transform: translateX(-50%) translateY(30px);
            }
            60% {
              opacity: 1;
            }
            100% {
              height: 55%;
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
          @keyframes flicker {
            0%, 100% { opacity: 1; }
            25% { opacity: 0.6; }
            50% { opacity: 0.9; }
            75% { opacity: 0.5; }
          }
          @keyframes sparkle1 {
            0%, 100% { opacity: 0; transform: translateX(-50%) translateY(0) scale(1); }
            50% { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.5); }
          }
          @keyframes sparkle2 {
            0%, 100% { opacity: 0; transform: translateX(-50%) translateY(0) scale(0.5); }
            50% { opacity: 1; transform: translateX(-50%) translateY(-15px) scale(2); }
          }
          @keyframes sparkle3 {
            0%, 100% { opacity: 0; transform: translateX(-50%) translateY(0) scale(1); }
            70% { opacity: 1; transform: translateX(-50%) translateY(-8px) scale(1.8); }
          }
          .animate-flicker {
            animation: flicker 2.5s ease-in-out infinite;
          }
          .animate-sparkle1 {
            animation: sparkle1 2s ease-in-out infinite;
          }
          .animate-sparkle2 {
            animation: sparkle2 2.5s ease-in-out infinite;
            animation-delay: 0.5s;
          }
          .animate-sparkle3 {
            animation: sparkle3 1.8s ease-in-out infinite;
            animation-delay: 1s;
          }
        `}</style>
      </div>
    </main>
  );
}