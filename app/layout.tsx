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
                    { name: 'Instagram', path: 'M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.153-1.772c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465 1.067-.047 1.407-.06 4.123-.06h.08zm0-2c-2.715 0-3.056.01-4.122.06-1.065.05-1.79.217-2.428.465-1.06.414-1.963 1.087-2.692 1.816-.729.729-1.402 1.632-1.816 2.693-.248.638-.415 1.363-.465 2.428-.05 1.066-.06 1.407-.06 4.122 0 2.716.01 3.056.06 4.122.05 1.065.217 1.79.465 2.428.414 1.06 1.087 1.963 1.816 2.692.729.729 1.632 1.402 2.693 1.816.638.248 1.363.415 2.428.465 1.066.05 1.407.06 4.122.06 2.716 0 3.056-.01 4.122-.06 1.065-.05 1.79-.217 2.428-.465 1.06-.414 1.963-1.087 2.692-1.816.729-.729 1.402-1.632 1.816-2.693.248-.638.415-1.363.465-2.428.05-1.066.06-1.407.06-4.122-.06zM12.315 12a4.408 4.408 0 110-8.817 4.408 4.408 0 010 8.817zm0-6.408a2 2 0 100 4 2 2 0 000-4zm6.52 1.334a1.218 1.218 0 110-2.436 1.218 1.218 0 010 2.436z' }
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
