/**
 * PageLoader — a simple, professional full-page loading indicator.
 * Uses the brand's primary gradient and a subtle pulsing dot animation.
 */
export function PageLoader() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      aria-label="Loading"
      role="status"
    >
      {/* Brand mark */}
      <span
        className="grid size-14 place-items-center rounded-2xl shadow-glow pulse-ring mb-6"
        style={{ background: "var(--gradient-primary)" }}
        aria-hidden="true"
      >
        {/* Spoon + fork silhouette SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-7 text-primary-foreground"
        >
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 .55.45 1 1 1h3c.55 0 1 .45 1 1v1" />
          <path d="M18 22v-3h-3" />
          <path d="M18 19a4 4 0 0 0 4-4" />
        </svg>
      </span>

      {/* Three bouncing dots */}
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

      <p className="mt-5 text-xs font-medium tracking-widest uppercase text-muted-foreground">
        Preparing your experience…
      </p>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
