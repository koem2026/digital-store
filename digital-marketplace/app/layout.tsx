export const metadata = {
  title: "Digital Marketplace",
  description: "Ebooks, courses, templates, research, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
