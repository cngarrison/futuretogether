import qrcode from "qrcode-generator";

interface Props {
  url: string;
  class?: string;
  style?: string;
}

/**
 * Server-rendered QR code suitable for ordinary components and dynamically
 * imported slideshow modules. It deliberately does not create a Fresh island.
 */
export default function QRCode({ url, class: className, style }: Props) {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();

  return (
    <div
      class={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: qr.createSvgTag({ scalable: true, margin: 1 }) }}
    />
  );
}
