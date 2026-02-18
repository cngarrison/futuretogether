import { useSignal, useSignalEffect } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
}

export default function TurnstileWidget(
  { siteKey, onVerify, onError, onExpire }: TurnstileWidgetProps,
) {
  const widgetId = useSignal<string | null>(null);
  const isLoaded = useSignal(false);
  const containerRef = useSignal<HTMLDivElement | null>(null);

  // Load Turnstile script
  useEffect(() => {
    if (isLoaded.value) return;

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isLoaded.value = true;
    };
    script.onerror = () => {
      console.error("Failed to load Turnstile script");
      onError?.("Failed to load captcha");
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Render widget when script is loaded
  useSignalEffect(() => {
    if (!isLoaded.value || !containerRef.value || widgetId.value) return;

    // @ts-ignore - Turnstile global
    if (typeof globalThis.turnstile !== "undefined") {
      try {
        // @ts-ignore
        const id = globalThis.turnstile.render(containerRef.value, {
          sitekey: siteKey,
          callback: (token: string) => {
            console.log("Turnstile: Token received");
            onVerify(token);
          },
          "error-callback": () => {
            console.error("Turnstile: Error occurred");
            onError?.("Captcha verification failed");
          },
          "expired-callback": () => {
            console.log("Turnstile: Token expired");
            onExpire?.();
          },
          theme: "auto", // Automatically matches light/dark mode
          size: "normal",
        });
        widgetId.value = id;
      } catch (error) {
        console.error("Turnstile render error:", error);
        onError?.("Failed to initialize captcha");
      }
    }
  });

  return (
    <div>
      <div
        ref={(el) => {
          containerRef.value = el;
        }}
        class="flex justify-center my-4"
      />
    </div>
  );
}
