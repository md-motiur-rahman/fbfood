export type Category = {
  name: string;
  slug: string;
  img: string;
};

export type Product = {
  id: number | string;
  name: string;
  img: string;
  category: string; // slug
  badge?: string;
};

export const categories: Category[] = [
  { name: "Chocolates", slug: "chocolates", img: "https://images.unsplash.com/photo-1548907040-4b7b09443896?q=80&w=1200&auto=format&fit=crop" },
  { name: "Biscuits", slug: "biscuits", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop" },
  { name: "Snacks", slug: "snacks", img: "https://images.unsplash.com/photo-1585238342028-4bbc0e5406d2?q=80&w=1200&auto=format&fit=crop" },
  { name: "Beverages", slug: "beverages", img: "https://images.unsplash.com/photo-1517705382263-1a4d54faed66?q=80&w=1200&auto=format&fit=crop" },
  { name: "Bakery", slug: "bakery", img: "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=1200&auto=format&fit=crop" },
  { name: "Seasonal", slug: "seasonal", img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop" },
];

export const products: Product[] = [
  { id: 1, name: "Milk Choco Minis", img: "https://images.unsplash.com/photo-1548907040-4b7b09443896?q=80&w=800&auto=format&fit=crop", category: "chocolates", badge: "Best Seller" },
  { id: 2, name: "Dark Choco Bar 70%", img: "https://images.unsplash.com/photo-1612177572781-c280c3186750?q=80&w=800&auto=format&fit=crop", category: "chocolates", badge: "New" },
  { id: 3, name: "Choco Wafer Packs", img: "https://images.unsplash.com/photo-1625944529157-efb2b6194c0e?q=80&w=800&auto=format&fit=crop", category: "biscuits" },
  { id: 4, name: "Oatmeal Cookies", img: "https://images.unsplash.com/photo-1461009209120-103138d8b874?q=80&w=800&auto=format&fit=crop", category: "biscuits", badge: "Hot" },
  { id: 5, name: "Savory Mix", img: "https://images.unsplash.com/photo-1585238342028-4bbc0e5406d2?q=80&w=800&auto=format&fit=crop", category: "snacks" },
  { id: 6, name: "Sparkling Drink", img: "https://images.unsplash.com/photo-1517705382263-1a4d54faed66?q=80&w=800&auto=format&fit=crop", category: "beverages" },
  { id: 7, name: "Muffin Pack", img: "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=800&auto=format&fit=crop", category: "bakery" },
  { id: 8, name: "Holiday Assortment", img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop", category: "seasonal" },
];
