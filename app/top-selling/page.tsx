import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";

const items = [
  { id: 1, name: "Milk Choco Minis", img: "https://images.unsplash.com/photo-1548907040-4b7b09443896?q=80&w=800&auto=format&fit=crop", badge: "Best Seller" },
  { id: 2, name: "Oatmeal Cookies", img: "https://images.unsplash.com/photo-1461009209120-103138d8b874?q=80&w=800&auto=format&fit=crop", badge: "Hot" },
  { id: 3, name: "Caramel Bites", img: "https://images.unsplash.com/photo-1542528180-a1208c5169a0?q=80&w=800&auto=format&fit=crop" },
  { id: 4, name: "Choco Chip Cookies", img: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800&auto=format&fit=crop" },
];

export default function TopSellingPage() {
    return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Top Selling</h1>
        <p className="mt-2 text-sm text-zinc-600">Best performing products by demand.</p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} id={p.id} name={p.name} img={p.img} badge={(p as any).badge} onDetailsHref="#" />
          ))}
        </div>
      </main>
    </div>
  );
}
