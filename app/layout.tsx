import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tradello",
  description: "The open source trading journal built for serious traders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              var s = localStorage.getItem('tradello_settings');
              if (s) {
                var settings = JSON.parse(s);
                var colorMap = {
                  '#00e57a': 'rgba(0,229,122,0.12)',
                  '#4d9fff': 'rgba(77,159,255,0.12)',
                  '#a78bfa': 'rgba(167,139,250,0.12)',
                  '#fb923c': 'rgba(251,146,60,0.12)',
                  '#f472b6': 'rgba(244,114,182,0.12)',
                };
                var accent = settings.accentColor;
                if (accent && colorMap[accent]) {
                  document.documentElement.style.setProperty('--accent-green', accent);
                  document.documentElement.style.setProperty('--accent-dim', colorMap[accent]);
                  document.documentElement.style.setProperty('--accent-green-dim', colorMap[accent]);
                }
              }
            } catch(e) {}
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}