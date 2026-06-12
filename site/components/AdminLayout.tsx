import type { ComponentChildren } from "preact";

interface AdminLayoutProps {
  children: ComponentChildren;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Future Together Admin</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-[#f7f4ef]">
        {children}
      </body>
    </html>
  );
}
