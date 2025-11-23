import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "./components/ClientProviders";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "FBFOOD | Wholesale Chocolates, Biscuits & Snacks",
  description: "FBFOOD is a wholesale supplier of chocolates, biscuits, snacks and beverages. Bulk pricing, fast shipping and dedicated B2B support.",
  keywords: ["FBFOOD", "wholesale", "chocolate", "biscuits", "snacks", "beverages", "B2B", "bulk"],
  openGraph: {
    title: "FBFOOD | Wholesale Chocolates, Biscuits & Snacks",
    description: "Wholesale supplier for chocolates, biscuits, snacks and beverages. Bulk pricing and fast delivery.",
    url: "https://fbfood.co.uk",
    siteName: "FBFOOD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FBFOOD | Wholesale Chocolates, Biscuits & Snacks",
    description: "Bulk pricing, fast delivery and dedicated support for businesses.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
    
        <div suppressHydrationWarning>
          
          <ClientProviders>{children}</ClientProviders>
        </div>
        <footer className="border-t border-amber-300 bg-amber-100 text-zinc-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-grid h-8 w-8 place-items-center rounded bg-amber-500 text-zinc-900 font-bold shadow-sm">FB</span>
                <span className="text-base font-semibold">FBFOOD</span>
              </div>
              <p className="mt-3 text-sm text-zinc-700 max-w-sm">Wholesale chocolates, biscuits, snacks and beverages for retailers, cafes and offices.</p>
            </div>
            <div>
              <div className="text-sm font-semibold">Get in touch</div>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a className="hover:underline hover:text-amber-700" href="mailto:sales@fbfood.example">sales@fbfood.example</a></li>
                <li><a className="hover:underline hover:text-amber-700" href="tel:+10000000000">+1 (000) 000-0000</a></li>
                <li className="text-zinc-700">Mon–Fri, 9am–6pm</li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold">Navigation</div>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a className="hover:underline hover:text-amber-700" href="/whats-new">What's New</a></li>
                <li><a className="hover:underline hover:text-amber-700" href="/top-selling">Top Selling</a></li>
                <li><a className="hover:underline hover:text-amber-700" href="/faqs">FAQ's</a></li>
                <li><a className="hover:underline hover:text-amber-700" href="/contact">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-amber-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 text-xs text-zinc-700 flex items-center justify-between">
              <span>© {new Date().getFullYear()} FBFOOD. All rights reserved.</span>
              <span>Wholesale • B2B • Foodservice</span>
            </div>
          </div>
        </footer>
        <Script
    id="tawk-embed"
    strategy="afterInteractive"
    dangerouslySetInnerHTML={{
      __html: `
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
        (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/69221b9f88c368196603e977/1jamjnqee';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
        })();
      `,
    }}
  />
      </body>
    </html>
  );
}
