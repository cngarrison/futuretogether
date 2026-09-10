import { useEffect, useRef } from "preact/hooks";
import qrcode from "qrcode-generator";

/**
 * Client-side QR-code island for uses that genuinely need browser-side updates.
 *
 * Do not import this island from dynamically loaded slideshow modules (for
 * example, modules loaded via `import.meta.glob`). Fresh may render the island
 * boundary without including it in the production hydration manifest, which
 * aborts hydration before other slideshow islands can run. Use the regular
 * server-rendered `@/components/QRCode.tsx` component in slideshow content.
 */

interface Props {
  url: string;
  class?: string;
  style?: string;
}

export default function QRCode({ url, class: className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const qr = qrcode(0, "M");
    qr.addData(url);
    qr.make();
    ref.current.innerHTML = qr.createSvgTag({ scalable: true, margin: 1 });
  }, [url]);

  return <div ref={ref} class={className} style={style} />;
}
