import { Providers } from "./providers";
import Header from "@/components/header";
import "./globals.css";

export const metadata = {
  title: "Shelby Storage",
  description: "Decentralized Hot Data Storage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 font-sans min-h-screen">
        <Providers>
          <Header />
          <main className="max-w-6xl mx-auto p-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
