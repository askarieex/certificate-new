import type { Metadata } from "next";
import "./globals.css";
import "./styles.css";
import { AuthProvider } from "../utils/AuthContext";

export const metadata: Metadata = {
  title: "School DOB Certificate Generator",
  description: "Generate Date of Birth certificates for school students with ease",
  keywords: "certificate generator, DOB certificate, school certificate, student documents",
  authors: [{ name: "Certificate Generator Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <AuthProvider>
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
