import { useEffect, useState } from "react";
import { ChefHat } from "lucide-react";
import packageJson from "../../package.json";

interface StartupSplashProps {
  onComplete: () => void;
}

export function StartupSplash({ onComplete }: StartupSplashProps) {
  const [loadingText, setLoadingText] = useState("Checking app version...");

  useEffect(() => {
    setLoadingText("Checking app version and security status...");
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background">
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="flex flex-col items-center gap-6">
        <span
          className="grid size-20 place-items-center rounded-3xl shadow-glow pulse-ring"
          style={{ background: "var(--gradient-primary)" }}
        >
          <ChefHat className="size-10 text-primary-foreground" />
        </span>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-2 rounded-full bg-primary"
                style={{
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <h2 className="mt-4 text-xl font-display font-bold gradient-text">
            v{packageJson.version}
          </h2>
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground animate-pulse transition-all">
            {loadingText}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
