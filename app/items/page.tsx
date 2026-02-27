import Navbar from "../components/Navbar";
import ItemsClient from "./ItemsClient";
import { Suspense } from "react";

export default function ItemsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <Suspense fallback={<main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">Loading items…</main>}>
        <ItemsClient />
      </Suspense>
    </div>
  );
}
