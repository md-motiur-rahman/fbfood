import Navbar from "../components/Navbar";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Contact</h1>
        <p className="mt-2 text-sm text-slate-600">Reach our wholesale team. We respond within 24 hours.</p>
        <div className="mt-6 grid gap-4">
          <a className="inline-flex items-center gap-2 text-sm font-medium hover:underline" href="mailto:sales@fbfood.example">sales@fbfood.example</a>
          <a className="inline-flex items-center gap-2 text-sm font-medium hover:underline" href="tel:+10000000000">+1 (000) 000-0000</a>
          <div className="text-sm text-slate-600">Mon–Fri, 9am–6pm</div>
        </div>
        <form className="mt-8 grid gap-4">
          <input className="h-11 rounded-md border border-black/10 px-3 text-sm" placeholder="Company Name" />
          <div className="grid sm:grid-cols-2 gap-4">
            <input className="h-11 rounded-md border border-black/10 px-3 text-sm" placeholder="Your Name" />
            <input className="h-11 rounded-md border border-black/10 px-3 text-sm" placeholder="Email" type="email" />
          </div>
          <textarea className="min-h-[120px] rounded-md border border-black/10 px-3 py-2 text-sm" placeholder="Tell us what you need (SKUs, quantities, frequency)" />
          <button className="inline-flex h-11 items-center justify-center rounded-full bg-sky-500 px-6 text-sm font-semibold text-slate-900 shadow hover:bg-sky-400 w-fit">Request Quote</button>
        </form>
      </main>
    </div>
  );
}
