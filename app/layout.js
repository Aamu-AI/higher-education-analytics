import "@fontsource-variable/dm-sans";
import "./globals.css";

export const metadata = {
  title: "Funding and degree awards | Aamu Analytics",
  description:
    "Compare funding evidence and degree outcomes across Finnish universities of applied sciences.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
