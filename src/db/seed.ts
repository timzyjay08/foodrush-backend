import "dotenv/config";
import { db, pool } from "./index";
import {
  users,
  restaurants,
  menuItems,
  foodItemOptions,
  addresses,
  deliveryRiders,
  coupons,
} from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const PASSWORD = "Password123!";

type MenuTemplate = { name: string; category: string; price: number; desc?: string }[];

const CUISINE_MENUS: Record<string, MenuTemplate> = {
  Nigerian: [
    { name: "Jollof Rice & Chicken", category: "Rice", price: 2500, desc: "Smoky party jollof with grilled chicken" },
    { name: "Fried Rice Special", category: "Rice", price: 2800, desc: "Vegetable fried rice with chicken" },
    { name: "Egusi Soup & Pounded Yam", category: "Swallow", price: 2200, desc: "Rich egusi with smooth pounded yam" },
    { name: "Amala & Ewedu", category: "Swallow", price: 1500, desc: "Soft amala with ewedu and gbegiri" },
    { name: "Peppered Chicken", category: "Chicken", price: 3500, desc: "Spicy grilled chicken" },
    { name: "Beef Suya", category: "Grills", price: 3000, desc: "Spiced grilled beef skewers" },
    { name: "Moi Moi", category: "Sides", price: 800, desc: "Steamed bean pudding" },
    { name: "Chapman", category: "Drinks", price: 1500, desc: "Nigerian non-alcoholic cocktail" },
  ],
  Grills: [
    { name: "Beef Suya", category: "Grills", price: 3000 },
    { name: "Chicken Suya", category: "Grills", price: 3500 },
    { name: "Grilled Croaker Fish", category: "Grills", price: 4500 },
    { name: "Asun", category: "Grills", price: 4000, desc: "Spicy smoked goat meat" },
    { name: "Kilishi", category: "Sides", price: 2500, desc: "Dried spiced beef" },
  ],
  "Fast Food": [
    { name: "Beef Burger", category: "Burgers", price: 4500 },
    { name: "Chicken Burger", category: "Burgers", price: 4500 },
    { name: "Chicken Shawarma", category: "Shawarma", price: 3500 },
    { name: "Chicken & Chips", category: "Chicken", price: 4000 },
    { name: "Meat Pie", category: "Sides", price: 1200 },
    { name: "French Fries", category: "Sides", price: 1500 },
    { name: "Zobo Drink", category: "Drinks", price: 800 },
  ],
  Pizza: [
    { name: "Margherita Pizza", category: "Pizza", price: 6000 },
    { name: "Pepperoni Pizza", category: "Pizza", price: 7500 },
    { name: "BBQ Chicken Pizza", category: "Pizza", price: 8000 },
    { name: "Veggie Pizza", category: "Pizza", price: 7000 },
    { name: "Hawaiian Pizza", category: "Pizza", price: 7800 },
  ],
  Chinese: [
    { name: "Chicken Fried Rice", category: "Rice", price: 3500 },
    { name: "Sweet & Sour Chicken", category: "Chicken", price: 4000 },
    { name: "Spring Rolls", category: "Sides", price: 2000 },
    { name: "Chicken Noodles", category: "Pasta", price: 2500 },
    { name: "Veg Stir Fry", category: "Main Meals", price: 2800 },
  ],
  Italian: [
    { name: "Spaghetti Bolognese", category: "Pasta", price: 4000 },
    { name: "Lasagna", category: "Pasta", price: 5500 },
    { name: "Alfredo Pasta", category: "Pasta", price: 4500 },
    { name: "Margherita Pizza", category: "Pizza", price: 6000 },
    { name: "Garlic Bread", category: "Sides", price: 2000 },
  ],
  Continental: [
    { name: "Grilled Chicken", category: "Chicken", price: 4500 },
    { name: "Fish & Chips", category: "Main Meals", price: 5000 },
    { name: "Beef Steak", category: "Main Meals", price: 8000 },
    { name: "Caesar Salad", category: "Sides", price: 3000 },
    { name: "Mashed Potatoes", category: "Sides", price: 1800 },
  ],
};

const RESTAURANTS: { name: string; cuisine: string; city: string }[] = [
  { name: "Lagos Bites", cuisine: "Continental", city: "Lagos" },
  { name: "Naija Kitchen", cuisine: "Nigerian", city: "Lagos" },
  { name: "Mama's Pot", cuisine: "Nigerian", city: "Abuja" },
  { name: "The Jollof Spot", cuisine: "Nigerian", city: "Lagos" },
  { name: "Suya Central", cuisine: "Grills", city: "Abuja" },
  { name: "Urban Shawarma", cuisine: "Fast Food", city: "Lagos" },
  { name: "ChopLife Kitchen", cuisine: "Nigerian", city: "Port Harcourt" },
  { name: "Abuja Grill", cuisine: "Grills", city: "Abuja" },
  { name: "Golden Wok", cuisine: "Chinese", city: "Lagos" },
  { name: "Pizza Roma", cuisine: "Italian", city: "Lagos" },
  { name: "Amala Palace", cuisine: "Nigerian", city: "Ibadan" },
  { name: "Fried Rice Hub", cuisine: "Nigerian", city: "Lagos" },
  { name: "Pepper Soup House", cuisine: "Nigerian", city: "Port Harcourt" },
  { name: "Kilimanjaro Express", cuisine: "Fast Food", city: "Abuja" },
  { name: "Mr Biggs", cuisine: "Fast Food", city: "Lagos" },
  { name: "Chicken Republic", cuisine: "Fast Food", city: "Lagos" },
  { name: "Domino's Lagos", cuisine: "Pizza", city: "Lagos" },
  { name: "Captain Cook", cuisine: "Continental", city: "Abuja" },
  { name: "Bukka Express", cuisine: "Nigerian", city: "Lagos" },
  { name: "Sweet Sensation", cuisine: "Fast Food", city: "Lagos" },
];

const RIDER_NAMES = [
  "Emeka Okafor", "Tunde Bakare", "Chinedu Eze", "Ibrahim Musa", "Segun Adeyemi",
  "Femi Johnson", "Oluwaseun Ade", "Kelechi Nwosu", "Yusuf Bello", "Adaeze Obi",
];

async function main() {
  console.log("Seeding FoodRush database...");

  const hash = await bcrypt.hash(PASSWORD, 10);

  // --- Admin ---
  let admin = await db.query.users.findFirst({ where: eq(users.email, "admin@delivery.dev") });
  if (!admin) {
    [admin] = await db.insert(users).values({ name: "System Admin", email: "admin@delivery.dev", passwordHash: hash, role: "admin", phone: "08000000000" }).returning();
  }

  // --- Learner / Mentor (learning platform roles) ---
  let learner = await db.query.users.findFirst({ where: eq(users.email, "learner@delivery.dev") });
  if (!learner) {
    [learner] = await db.insert(users).values({ name: "Ada Learner", email: "learner@delivery.dev", passwordHash: hash, role: "learner", phone: "08000000001" }).returning();
  }
  let mentor = await db.query.users.findFirst({ where: eq(users.email, "mentor@delivery.dev") });
  if (!mentor) {
    [mentor] = await db.insert(users).values({ name: "Prof. Mentor", email: "mentor@delivery.dev", passwordHash: hash, role: "mentor", phone: "08000000002" }).returning();
  }

  // --- Restaurant owners (2) ---
  const owners = [];
  for (let i = 0; i < 2; i++) {
    const email = i === 0 ? "owner@delivery.dev" : "owner2@delivery.dev";
    let u = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!u) {
      [u] = await db.insert(users).values({ name: i === 0 ? "Marco Rossi" : "Aisha Bello", email, passwordHash: hash, role: "restaurant", phone: "08011111111" }).returning();
    }
    owners.push(u);
  }

  // --- Riders (10) ---
  const riders = [];
  for (let i = 0; i < 10; i++) {
    const email = i === 0 ? "rider@delivery.dev" : `rider${i + 1}@delivery.dev`;
    let u = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!u) {
      [u] = await db.insert(users).values({ name: RIDER_NAMES[i], email, passwordHash: hash, role: "rider", phone: `0802${String(1000000 + i).slice(0, 8)}` }).returning();
    }
    let profile = await db.query.deliveryRiders.findFirst({ where: eq(deliveryRiders.userId, u.id) });
    if (!profile) {
      await db.insert(deliveryRiders).values({ userId: u.id, vehicle: i % 2 === 0 ? "Motorcycle" : "Bicycle" });
    }
    riders.push(u);
  }

  // --- Customers (30) ---
  const customers = [];
  for (let i = 0; i < 30; i++) {
    const email = i === 0 ? "customer@delivery.dev" : `customer${i + 1}@delivery.dev`;
    let u = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!u) {
      [u] = await db.insert(users).values({ name: `Customer ${i + 1}`, email, passwordHash: hash, role: "customer", phone: `0803${String(1000000 + i).slice(0, 8)}` }).returning();
    }
    customers.push(u);
  }

  // --- Restaurants + menu items (20 restaurants, ~100 items) ---
  const cuisineOffsets: Record<string, number> = {};
  for (const r of RESTAURANTS) {
    const owner = owners[(RESTAURANTS.indexOf(r)) % owners.length];
    let restaurant = await db.query.restaurants.findFirst({ where: eq(restaurants.name, r.name) });
    if (!restaurant) {
      [restaurant] = await db.insert(restaurants).values({
        name: r.name,
        cuisine: r.cuisine,
        description: `${r.name} — serving the best ${r.cuisine.toLowerCase()} in ${r.city}.`,
        address: `${20 + (RESTAURANTS.indexOf(r) % 50)} ${r.name.split(" ")[0]} Street`,
        city: r.city,
        phone: `0804${String(1000000 + RESTAURANTS.indexOf(r)).slice(0, 8)}`,
        ownerId: owner.id,
        deliveryTimeMinutes: 20 + (RESTAURANTS.indexOf(r) % 30),
        isApproved: true,
      }).returning();
    }

    const template = CUISINE_MENUS[r.cuisine] ?? CUISINE_MENUS["Nigerian"];
    const offset = (cuisineOffsets[r.cuisine] ?? 0) * 2;
    cuisineOffsets[r.cuisine] = (cuisineOffsets[r.cuisine] ?? 0) + 1;

    for (let i = 0; i < 5; i++) {
      const t = template[(offset + i) % template.length];
      const exists = await db.query.menuItems.findFirst({
        where: (cols, { and, eq: eqv }) => and(eqv(cols.restaurantId, restaurant.id), eqv(cols.name, t.name)),
      });
      if (!exists) {
        const [item] = await db
          .insert(menuItems)
          .values({ restaurantId: restaurant.id, name: t.name, description: t.desc, price: t.price, category: t.category })
          .returning();

        // Add customization options to burgers and pizzas.
        if (t.category === "Burgers") {
          await db.insert(foodItemOptions).values([
            { menuItemId: item.id, name: "Extra Cheese", price: 500 },
            { menuItemId: item.id, name: "Extra Chicken", price: 1500 },
            { menuItemId: item.id, name: "Fries", price: 1000 },
          ]);
        }
        if (t.category === "Pizza") {
          await db.insert(foodItemOptions).values([
            { menuItemId: item.id, name: "Extra Cheese", price: 500 },
            { menuItemId: item.id, name: "Extra Toppings", price: 800 },
          ]);
        }
      }
    }
  }

  // --- Default address for demo customer ---
  const demoCustomer = customers[0];
  const existingAddr = await db.query.addresses.findFirst({ where: eq(addresses.userId, demoCustomer.id) });
  if (!existingAddr) {
    await db.insert(addresses).values({
      userId: demoCustomer.id,
      label: "Home",
      street: "12 Admiralty Way",
      city: "Lekki",
      state: "Lagos",
      zip: "101233",
      isDefault: true,
    });
  }

  // --- Coupons ---
  const couponCodes = ["WELCOME10", "JUMBO500", "FREE5"];
  for (const c of couponCodes) {
    const exists = await db.query.coupons.findFirst({ where: eq(coupons.code, c) });
    if (!exists) {
      await db.insert(coupons).values({
        code: c,
        discountType: c === "JUMBO500" ? "fixed" : "percentage",
        discountValue: c === "JUMBO500" ? 500 : c === "WELCOME10" ? 10 : 5,
        maxUses: 1000,
      });
    }
  }

  console.log("Seed complete!");
  console.log(`Demo accounts (password: ${PASSWORD}):`);
  console.log("  admin@delivery.dev    -> admin");
  console.log("  learner@delivery.dev  -> learner");
  console.log("  mentor@delivery.dev   -> mentor");
  console.log("  owner@delivery.dev    -> restaurant");
  console.log("  rider@delivery.dev    -> rider");
  console.log("  customer@delivery.dev -> customer");
  console.log("Coupons: WELCOME10 (10%), JUMBO500 (₦500 off), FREE5 (5%)");
}

main()
  .then(async () => { await pool.end(); process.exit(0); })
  .catch(async (err) => { console.error("Seed failed:", err); await pool.end(); process.exit(1); });
