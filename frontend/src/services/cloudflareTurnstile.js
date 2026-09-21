const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";
let scriptPromise;

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.turnstile), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function renderTurnstile(container, siteKey, { onToken, onExpired, onError }) {
  if (!siteKey) throw new Error("Cloudflare Turnstile site key is not configured");

  const turnstile = await loadTurnstileScript();
  return turnstile.render(container, {
    sitekey: siteKey,
    callback: onToken,
    "expired-callback": onExpired,
    "error-callback": onError,
  });
}

export function removeTurnstile(widgetId) {
  if (window.turnstile && widgetId !== undefined) window.turnstile.remove(widgetId);
}
