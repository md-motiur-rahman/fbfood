import Navbar from "../components/Navbar";
import CategoryCard from "../components/CategoryCard";
import { inventoryCategories } from "../data/inventory";

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Categories</h1>
        <p className="mt-2 text-sm text-zinc-600">Browse wholesale categories. Pricing confirmed based on order quantity.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {inventoryCategories.map((c) => (
            <CategoryCard key={c.slug} name={c.name} slug={c.slug} img={c.picture} />
          ))}
        </div>
      </main>
    </div>
  );
}
