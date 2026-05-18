import { useEffect, useRef } from "preact/hooks";
import qrcode from "qrcode-generator";

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
