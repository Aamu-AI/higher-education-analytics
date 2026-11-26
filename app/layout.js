import "@fontsource-variable/dm-sans";
import "./globals.css";

export const metadata = {
  title: "Degree awards | Aamu Analytics",
  description:
    "Explore final degree awards across Finnish universities of applied sciences.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
