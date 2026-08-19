import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONSENT_COOKIE, getCookie, setCookie } from "@/lib/cookies";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!getCookie(CONSENT_COOKIE));
  }, []);

  if (!visible) return null;

  function decide(value: "all" | "essential") {
    setCookie(CONSENT_COOKIE, value, 60 * 60 * 24 * 180);
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 print:hidden">
      <div className="glass animate-rise mx-auto flex max-w-3xl flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:items-center">
        <Cookie className="size-5 shrink-0 text-accent" />
        <p className="flex-1 text-xs text-muted-foreground">
          We use essential first-party cookies to remember your table, cart and secure session. No
          third-party tracking, ever.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="glass" size="sm" className="rounded-full" onClick={() => decide("essential")}>
            Essential only
          </Button>
          <Button variant="hero" size="sm" className="rounded-full" onClick={() => decide("all")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
