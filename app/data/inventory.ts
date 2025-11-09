// Dummy inventory data for FBFOOD
// 10 categories and 60+ products

export type InventoryCategory = {
  name: string;
  slug: string; // used to link products to categories
  picture: string;
};

export type InventoryProduct = {
  productname: string;
  category: string; // slug referencing InventoryCategory.slug
  outerbarcode: string; // EAN/UPC as string
  caseSize: number; // units per case
  palletSize: number; // cases per pallet
  picture: string;
  itemquery: number; // popularity score for top selling
};

export const inventoryCategories: InventoryCategory[] = [
  { name: "Chocolates", slug: "chocolates", picture: "https://images.unsplash.com/photo-1548907040-4b7b09443896?q=80&w=1200&auto=format&fit=crop" },
  { name: "Biscuits", slug: "biscuits", picture: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop" },
  { name: "Snacks", slug: "snacks", picture: "https://images.unsplash.com/photo-1585238342028-4bbc0e5406d2?q=80&w=1200&auto=format&fit=crop" },
  { name: "Beverages", slug: "beverages", picture: "https://images.unsplash.com/photo-1517705382263-1a4d54faed66?q=80&w=1200&auto=format&fit=crop" },
  { name: "Bakery", slug: "bakery", picture: "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=1200&auto=format&fit=crop" },
  { name: "Seasonal", slug: "seasonal", picture: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop" },
  { name: "Candy", slug: "candy", picture: "https://images.unsplash.com/photo-1571689936114-d2f57f9d09d5?q=80&w=1200&auto=format&fit=crop" },
  { name: "Nuts", slug: "nuts", picture: "https://images.unsplash.com/photo-1604908554029-611d84f98549?q=80&w=1200&auto=format&fit=crop" },
  { name: "Cereals", slug: "cereals", picture: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1200&auto=format&fit=crop" },
  { name: "Spreads", slug: "spreads", picture: "https://images.unsplash.com/photo-1606313564200-e75d5e30476d?q=80&w=1200&auto=format&fit=crop" },
];

const baseProducts: Omit<InventoryProduct, "itemquery">[] = [
  // Chocolates (6)
  { productname: "Milk Chocolate Bar 50g", category: "chocolates", outerbarcode: "4006381333931", caseSize: 24, palletSize: 120, picture: "https://images.unsplash.com/photo-1612177572781-c280c3186750?q=80&w=800&auto=format&fit=crop" },
  { productname: "Dark Chocolate 70% 80g", category: "chocolates", outerbarcode: "5012345678900", caseSize: 20, palletSize: 100, picture: "https://images.unsplash.com/photo-1598899134739-24b0520c37ba?q=80&w=800&auto=format&fit=crop" },
  { productname: "Hazelnut Chocolate Blocks", category: "chocolates", outerbarcode: "7612345678908", caseSize: 12, palletSize: 96, picture: "https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?q=80&w=800&auto=format&fit=crop" },
  { productname: "Assorted Truffles Box", category: "chocolates", outerbarcode: "3012345678902", caseSize: 16, palletSize: 80, picture: "https://images.unsplash.com/photo-1606313562875-88a8a80d1f4c?q=80&w=800&auto=format&fit=crop" },
  { productname: "White Chocolate Bar 90g", category: "chocolates", outerbarcode: "8712345678903", caseSize: 18, palletSize: 90, picture: "https://images.unsplash.com/photo-1548365328-9f547fb09501?q=80&w=800&auto=format&fit=crop" },
  { productname: "Caramel Filled Chocolates", category: "chocolates", outerbarcode: "5412345678906", caseSize: 24, palletSize: 120, picture: "https://images.unsplash.com/photo-1582377861066-6c89f4f1a8c6?q=80&w=800&auto=format&fit=crop" },

  // Biscuits (6)
  { productname: "Butter Cookies 200g", category: "biscuits", outerbarcode: "5901234123457", caseSize: 24, palletSize: 80, picture: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop" },
  { productname: "Chocolate Chip Cookies 150g", category: "biscuits", outerbarcode: "8412345678901", caseSize: 30, palletSize: 90, picture: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=800&auto=format&fit=crop" },
  { productname: "Oatmeal Cookies 180g", category: "biscuits", outerbarcode: "6912345678905", caseSize: 24, palletSize: 84, picture: "https://images.unsplash.com/photo-1461009209120-103138d8b874?q=80&w=800&auto=format&fit=crop" },
  { productname: "Choco Wafer Sticks", category: "biscuits", outerbarcode: "7312345678903", caseSize: 36, palletSize: 72, picture: "https://images.unsplash.com/photo-1625944529157-efb2b6194c0e?q=80&w=800&auto=format&fit=crop" },
  { productname: "Shortbread Fingers 160g", category: "biscuits", outerbarcode: "5011111111117", caseSize: 20, palletSize: 100, picture: "https://images.unsplash.com/photo-1606117333905-0e7cce4a71ef?q=80&w=800&auto=format&fit=crop" },
  { productname: "Cream Sandwich Biscuits", category: "biscuits", outerbarcode: "5098765432103", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop" },

  // Snacks (6)
  { productname: "Salted Pretzels 250g", category: "snacks", outerbarcode: "4001234567899", caseSize: 20, palletSize: 80, picture: "https://images.unsplash.com/photo-1617692855027-0c12ff2c31d9?q=80&w=800&auto=format&fit=crop" },
  { productname: "BBQ Chips Family Pack", category: "snacks", outerbarcode: "5023456789012", caseSize: 18, palletSize: 72, picture: "https://images.unsplash.com/photo-1585238342028-4bbc0e5406d2?q=80&w=800&auto=format&fit=crop" },
  { productname: "Mixed Trail Snack 200g", category: "snacks", outerbarcode: "8711111111111", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop" },
  { productname: "Cheese Crackers 180g", category: "snacks", outerbarcode: "7611111111115", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1541592553160-82008b127ccb?q=80&w=800&auto=format&fit=crop" },
  { productname: "Corn Puffs 90g", category: "snacks", outerbarcode: "4212345678908", caseSize: 40, palletSize: 120, picture: "https://images.unsplash.com/photo-1596755094514-f87e3e0b6b6b?q=80&w=800&auto=format&fit=crop" },
  { productname: "Hot & Spicy Mix", category: "snacks", outerbarcode: "5312345678901", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=800&auto=format&fit=crop" },

  // Beverages (6)
  { productname: "Sparkling Orange 330ml", category: "beverages", outerbarcode: "4023456789010", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1517705382263-1a4d54faed66?q=80&w=800&auto=format&fit=crop" },
  { productname: "Iced Tea Lemon 500ml", category: "beverages", outerbarcode: "5900000000008", caseSize: 12, palletSize: 96, picture: "https://images.unsplash.com/photo-1541976590-713941681591?q=80&w=800&auto=format&fit=crop" },
  { productname: "Cold Brew Coffee 330ml", category: "beverages", outerbarcode: "4000000000005", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=800&auto=format&fit=crop" },
  { productname: "Still Water 1.5L", category: "beverages", outerbarcode: "7610000000002", caseSize: 6, palletSize: 120, picture: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=800&auto=format&fit=crop" },
  { productname: "Tonic Water 200ml", category: "beverages", outerbarcode: "4211111111119", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop" },
  { productname: "Mango Juice 1L", category: "beverages", outerbarcode: "5099999999996", caseSize: 12, palletSize: 96, picture: "https://images.unsplash.com/photo-1524594227085-32a6861bb4b5?q=80&w=800&auto=format&fit=crop" },

  // Bakery (6)
  { productname: "Blueberry Muffins 4pk", category: "bakery", outerbarcode: "4002222222223", caseSize: 12, palletSize: 60, picture: "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?q=80&w=800&auto=format&fit=crop" },
  { productname: "Chocolate Donuts 6pk", category: "bakery", outerbarcode: "5902222222221", caseSize: 10, palletSize: 80, picture: "https://images.unsplash.com/photo-1560180474-e8563fd75bab?q=80&w=800&auto=format&fit=crop" },
  { productname: "Croissant Butter 6pk", category: "bakery", outerbarcode: "7612222222227", caseSize: 12, palletSize: 72, picture: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop" },
  { productname: "Banana Bread Loaf", category: "bakery", outerbarcode: "4212222222220", caseSize: 16, palletSize: 64, picture: "https://images.unsplash.com/photo-1606313564200-e75d5e30476d?q=80&w=800&auto=format&fit=crop" },
  { productname: "Cinnamon Rolls 4pk", category: "bakery", outerbarcode: "5012222222224", caseSize: 12, palletSize: 60, picture: "https://images.unsplash.com/photo-1607920591413-4a18f2d875b9?q=80&w=800&auto=format&fit=crop" },
  { productname: "Mini Brownies 250g", category: "bakery", outerbarcode: "8412222222225", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1614707267537-c3f40f3986fb?q=80&w=800&auto=format&fit=crop" },

  // Seasonal (6)
  { productname: "Holiday Chocolate Tin", category: "seasonal", outerbarcode: "4003333333330", caseSize: 12, palletSize: 84, picture: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop" },
  { productname: "Gingerbread Cookies", category: "seasonal", outerbarcode: "5903333333338", caseSize: 20, palletSize: 80, picture: "https://images.unsplash.com/photo-1541454228950-4328debcfa0c?q=80&w=800&auto=format&fit=crop" },
  { productname: "Valentine Candy Hearts", category: "seasonal", outerbarcode: "7613333333334", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=800&auto=format&fit=crop" },
  { productname: "Easter Egg Assortment", category: "seasonal", outerbarcode: "4213333333337", caseSize: 18, palletSize: 72, picture: "https://images.unsplash.com/photo-1491002052546-bf38f186af03?q=80&w=800&auto=format&fit=crop" },
  { productname: "Autumn Spice Mix", category: "seasonal", outerbarcode: "5013333333331", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1543168256-418811576931?q=80&w=800&auto=format&fit=crop" },
  { productname: "New Year Gift Box", category: "seasonal", outerbarcode: "8413333333332", caseSize: 16, palletSize: 64, picture: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop" },

  // Candy (6)
  { productname: "Fruit Gummies 200g", category: "candy", outerbarcode: "4004444444447", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1571689936114-d2f57f9d09d5?q=80&w=800&auto=format&fit=crop" },
  { productname: "Sour Worms 150g", category: "candy", outerbarcode: "5904444444445", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1541976590-713941681591?q=80&w=800&auto=format&fit=crop" },
  { productname: "Lollipop Mix 50pcs", category: "candy", outerbarcode: "7614444444441", caseSize: 8, palletSize: 112, picture: "https://images.unsplash.com/photo-1601301362580-840cc63f2d9e?q=80&w=800&auto=format&fit=crop" },
  { productname: "Chocolate Toffees 300g", category: "candy", outerbarcode: "4214444444444", caseSize: 18, palletSize: 72, picture: "https://images.unsplash.com/photo-1628527304083-1d49a5d03459?q=80&w=800&auto=format&fit=crop" },
  { productname: "Mint Candies 250g", category: "candy", outerbarcode: "5014444444448", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1545289414-1c3cb029d8e0?q=80&w=800&auto=format&fit=crop" },
  { productname: "Caramel Chews 180g", category: "candy", outerbarcode: "8414444444449", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1581803118522-7b72b1a6e2c2?q=80&w=800&auto=format&fit=crop" },

  // Nuts (6)
  { productname: "Roasted Almonds 200g", category: "nuts", outerbarcode: "4005555555554", caseSize: 16, palletSize: 96, picture: "https://images.unsplash.com/photo-1604908554029-611d84f98549?q=80&w=800&auto=format&fit=crop" },
  { productname: "Cashews Salted 200g", category: "nuts", outerbarcode: "5905555555552", caseSize: 16, palletSize: 96, picture: "https://images.unsplash.com/photo-1505577058444-a3dab90d4253?q=80&w=800&auto=format&fit=crop" },
  { productname: "Pistachios 180g", category: "nuts", outerbarcode: "7615555555558", caseSize: 20, palletSize: 100, picture: "https://images.unsplash.com/photo-1596461404969-9ae70d0d97d6?q=80&w=800&auto=format&fit=crop" },
  { productname: "Peanut Mix 250g", category: "nuts", outerbarcode: "4215555555551", caseSize: 24, palletSize: 96, picture: "https://images.unsplash.com/photo-1559563458-527698bf5295?q=80&w=800&auto=format&fit=crop" },
  { productname: "Walnuts 200g", category: "nuts", outerbarcode: "5015555555555", caseSize: 16, palletSize: 96, picture: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800&auto=format&fit=crop" },
  { productname: "Hazelnuts 200g", category: "nuts", outerbarcode: "8415555555556", caseSize: 16, palletSize: 96, picture: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop" },

  // Cereals (6)
  { productname: "Honey Oat Cereal 500g", category: "cereals", outerbarcode: "4006666666661", caseSize: 12, palletSize: 96, picture: "https://images.unsplash.com/photo-1505575972945-280b9e3c5d4e?q=80&w=800&auto=format&fit=crop" },
  { productname: "Choco Flakes 375g", category: "cereals", outerbarcode: "5906666666669", caseSize: 16, palletSize: 96, picture: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800&auto=format&fit=crop" },
  { productname: "Corn Flakes 750g", category: "cereals", outerbarcode: "7616666666665", caseSize: 10, palletSize: 100, picture: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=800&auto=format&fit=crop" },
  { productname: "Granola Fruit 500g", category: "cereals", outerbarcode: "4216666666668", caseSize: 12, palletSize: 96, picture: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?q=80&w=800&auto=format&fit=crop" },
  { productname: "Multigrain Loops 375g", category: "cereals", outerbarcode: "5016666666662", caseSize: 16, palletSize: 96, picture: "https://images.unsplash.com/photo-1457384595864-b2db06ac7d67?q=80&w=800&auto=format&fit=crop" },
  { productname: "Protein Crunch 400g", category: "cereals", outerbarcode: "8416666666663", caseSize: 14, palletSize: 84, picture: "https://images.unsplash.com/photo-1587397845856-0f3a3638bf3f?q=80&w=800&auto=format&fit=crop" },

  // Spreads (6)
  { productname: "Hazelnut Cocoa Spread 350g", category: "spreads", outerbarcode: "4007777777778", caseSize: 12, palletSize: 96, picture: "https://images.unsplash.com/photo-1572552633759-1b4a5f963d8e?q=80&w=800&auto=format&fit=crop" },
  { productname: "Peanut Butter Crunchy 500g", category: "spreads", outerbarcode: "5907777777776", caseSize: 12, palletSize: 108, picture: "https://images.unsplash.com/photo-1611043714658-a8d516f4a3ee?q=80&w=800&auto=format&fit=crop" },
  { productname: "Almond Butter Smooth 300g", category: "spreads", outerbarcode: "7617777777772", caseSize: 12, palletSize: 96, picture: "https://images.unsplash.com/photo-1610348725531-843d0b5bcd5d?q=80&w=800&auto=format&fit=crop" },
  { productname: "Caramel Spread 320g", category: "spreads", outerbarcode: "4217777777775", caseSize: 12, palletSize: 96, picture: "https://images.unsplash.com/photo-1606313564200-e75d5e30476d?q=80&w=800&auto=format&fit=crop" },
  { productname: "Chocolate Syrup 500ml", category: "spreads", outerbarcode: "5017777777779", caseSize: 12, palletSize: 84, picture: "https://images.unsplash.com/photo-1606313563420-2f3e38f5cf2a?q=80&w=800&auto=format&fit=crop" },
  { productname: "Honey Jar 500g", category: "spreads", outerbarcode: "8417777777770", caseSize: 12, palletSize: 96, picture: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop" },
];

// Derive a deterministic pseudo-random score for itemquery from barcode
function stringHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

const scoreFrom = (barcode: string) => (Math.abs(stringHash(barcode)) % 1000) + 1;

export const inventoryProducts: InventoryProduct[] = baseProducts.map((p) => ({
  ...p,
  itemquery: scoreFrom(p.outerbarcode),
}));
