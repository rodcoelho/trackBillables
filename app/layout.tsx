import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackBillables - Time Tracking for Professionals",
  description: "Track your billable hours and projects with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
