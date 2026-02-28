import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ClientProviders from "./components/ClientProviders";
import TawkChat from "./components/TawkChat";
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
  description:
    "FBFOOD is a wholesale supplier of chocolates, biscuits, snacks and beverages. Bulk pricing, fast shipping and dedicated B2B support.",
  keywords: [
    "FBFOOD",
    "wholesale",
    "chocolate",
    "biscuits",
    "snacks",
    "beverages",
    "B2B",
    "bulk",
  ],
  openGraph: {
    title: "FBFOOD | Wholesale Chocolates, Biscuits & Snacks",
    description:
      "Wholesale supplier for chocolates, biscuits, snacks and beverages. Bulk pricing and fast delivery.",
    url: "https://fbfood.co.uk",
    siteName: "FBFOOD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FBFOOD | Wholesale Chocolates, Biscuits & Snacks",
    description:
    "Bulk pricing, fast delivery and dedicated support for businesses.",
  },
  icons: {
    icon: "/logo.png",
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
        <footer className="bg-slate-950 text-slate-300 pt-20 pb-10 border-t border-slate-900 font-sans relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-sky-500 opacity-50"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="container-custom relative z-10">
            {/* Top Section: Newsletter & Brand */}
            <div className="mb-16 pb-12 border-b border-slate-900">
              <div className="space-y-6 max-w-3xl">
                <Link href="/" className="inline-block">
                   <div className="p-3 bg-white rounded-2xl inline-block">
                      <Image
                        src="/logo.png"
                        alt="FB Food"
                        width={180}
                        height={60}
                        className="h-12 w-auto object-contain"
                      />
                   </div>
                </Link>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Your premium wholesale partner for chocolates, biscuits, snacks, and beverages. Elevating retail businesses with quality products and exceptional service.
                </p>
                <div className="flex gap-4">
                  {/* Socials with modern hover effects */}
                  {[
                    { name: 'Facebook', path: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z' },
                    { name: 'Twitter', path: 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' },
                    { name: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' }
                  ].map((social, idx) => (
                    <a key={idx} href="#" className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:bg-sky-500 hover:text-white hover:border-sky-500 hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-black/20">
                      <span className="sr-only">{social.name}</span>
                      <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d={social.path} clipRule="evenodd" /></svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
              <div>
                <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                  <span className="w-8 h-1 bg-sky-500 rounded-full"></span>
                  Quick Links
                </h4>
                <ul className="space-y-3">
                  {['Home', 'All Products', 'Categories', 'New Arrivals', 'Top Selling'].map((item, i) => (
                     <li key={i}><Link href={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`} className="text-slate-400 hover:text-sky-400 hover:pl-2 transition-all duration-300 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> {item}
                     </Link></li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                   <span className="w-8 h-1 bg-sky-500 rounded-full"></span>
                   Support
                </h4>
                <ul className="space-y-3">
                  {['Contact Us', 'My Account', 'Request Quote', 'Privacy Policy', 'Terms & Conditions'].map((item, i) => (
                     <li key={i}><Link href={item === 'Contact Us' ? '/contact' : item === 'My Account' ? '/auth/login' : item === 'Request Quote' ? '/quote' : '#'} className="text-slate-400 hover:text-sky-400 hover:pl-2 transition-all duration-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> {item}
                     </Link></li>
                  ))}
                </ul>
              </div>

              <div className="col-span-2 md:col-span-2">
                <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                   <span className="w-8 h-1 bg-sky-500 rounded-full"></span>
                   Contact Info
                </h4>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors group">
                     <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                     </div>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Email Support</p>
                     <a href="mailto:sales@fbfood.example" className="text-white font-medium hover:text-sky-400 transition-colors">sales@fbfood.example</a>
                  </div>
                  
                  <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors group">
                     <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                     </div>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Phone Support</p>
                     <a href="tel:+10000000000" className="text-white font-medium hover:text-sky-400 transition-colors">+1 (000) 000-0000</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-slate-500 text-sm">© {new Date().getFullYear()} FBFOOD. All rights reserved.</p>
              
              <div className="flex items-center gap-2">
                 {['Visa', 'Mastercard', 'Amex', 'PayPal'].map((pay) => (
                    <div key={pay} className="h-8 px-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs shadow-sm">
                      {pay}
                    </div>
                 ))}
              </div>
            </div>
          </div>
        </footer>
        <TawkChat />
        <SpeedInsights />
      </body>
    </html>
  );
}
