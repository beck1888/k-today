import "./globals.css";

export const metadata = {
  title: "K-Today Schedule",
  description: "Modern school schedule tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen p-4 md:p-8">{children}</body>
    </html>
  );
}
