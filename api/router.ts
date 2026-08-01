import { z } from "zod";
import { eq, desc, asc, like, or } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sellers, products, restaurants, menuItems, orders, orderItems, affiliates, listings } from "../db/schema";
import { adminRouter } from "./admin";

function orderCode() {
  return "US-" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  admin: adminRouter,

  products: createRouter({
    flashSale: publicQuery.query(async () => {
      const db = getDb();
      const rows = await db
        .select({ product: products, seller: sellers })
        .from(products)
        .innerJoin(sellers, eq(products.sellerId, sellers.id))
        .where(eq(products.flashSale, true));
      return rows
        .map(({ product, seller }) => ({
          ...product,
          sellerName: seller.shopName,
          sellerVerified: seller.verified,
          sellerRating: seller.rating / 10,
          discount: product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0,
        }))
        .sort((a, b) => Number(b.sellerVerified) - Number(a.sellerVerified));
    }),
    bySlug: publicQuery.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const db = getDb();
      const [row] = await db
        .select({ product: products, seller: sellers })
        .from(products)
        .innerJoin(sellers, eq(products.sellerId, sellers.id))
        .where(eq(products.slug, input.slug));
      if (!row) return null;
      return { ...row.product, sellerName: row.seller.shopName, sellerVerified: row.seller.verified };
    }),
    search: publicQuery.input(z.object({ q: z.string().min(1) })).query(async ({ input }) => {
      const db = getDb();
      const q = `%${input.q.trim()}%`;
      const rows = await db
        .select({ product: products, seller: sellers })
        .from(products)
        .innerJoin(sellers, eq(products.sellerId, sellers.id))
        .where(or(like(products.name, q), like(products.category, q)));
      return rows
        .map(({ product, seller }) => ({
          ...product,
          sellerName: seller.shopName,
          sellerVerified: seller.verified,
          discount: product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0,
        }))
        .sort((a, b) => Number(b.sellerVerified) - Number(a.sellerVerified));
    }),
  }),

  food: createRouter({
    search: publicQuery.input(z.object({ q: z.string().min(1) })).query(async ({ input }) => {
      const db = getDb();
      const q = `%${input.q.trim()}%`;
      return db.select().from(restaurants)
        .where(or(like(restaurants.name, q), like(restaurants.cuisine, q), like(restaurants.area, q)))
        .orderBy(desc(restaurants.rating));
    }),
    restaurants: publicQuery.query(async () => {
      const db = getDb();
      return db.select().from(restaurants).orderBy(desc(restaurants.featured), desc(restaurants.rating));
    }),
    restaurant: publicQuery.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const db = getDb();
      const [r] = await db.select().from(restaurants).where(eq(restaurants.slug, input.slug));
      if (!r) return null;
      const items = await db.select().from(menuItems).where(eq(menuItems.restaurantId, r.id)).orderBy(desc(menuItems.popular), asc(menuItems.price));
      return { ...r, items };
    }),
  }),

  orders: createRouter({
    create: publicQuery
      .input(z.object({
        customerName: z.string().min(2),
        phone: z.string().min(9),
        address: z.string().min(5),
        paymentMethod: z.enum(["mtn_momo", "airtel_money", "cash"]),
        items: z.array(z.object({
          itemType: z.enum(["product", "menu_item"]),
          itemId: z.number(),
          name: z.string(),
          price: z.number(),
          qty: z.number().min(1),
        })).min(1),
        deliveryFee: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const subtotal = input.items.reduce((s, i) => s + i.price * i.qty, 0);
        const total = subtotal + input.deliveryFee;
        const [row] = await db.insert(orders).values({
          code: orderCode(),
          customerName: input.customerName,
          phone: input.phone,
          address: input.address,
          paymentMethod: input.paymentMethod,
          subtotal,
          deliveryFee: input.deliveryFee,
          total,
        }).$returningId();
        await db.insert(orderItems).values(
          input.items.map((i) => ({ orderId: row.id, ...i })),
        );
        const [order] = await db.select().from(orders).where(eq(orders.id, row.id));
        return order;
      }),
    track: publicQuery.input(z.object({ code: z.string(), phone: z.string() })).query(async ({ input }) => {
      const db = getDb();
      const [order] = await db.select().from(orders).where(eq(orders.code, input.code.trim().toUpperCase()));
      if (!order || order.phone !== input.phone.trim()) return null;
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return { ...order, items };
    }),
  }),

  sellers: createRouter({
    register: publicQuery
      .input(z.object({
        shopName: z.string().min(2),
        ownerName: z.string().min(2),
        phone: z.string().min(9),
        email: z.string().optional(),
        idType: z.string(),
        idNumber: z.string().min(3),
        idPhotoName: z.string(),
        district: z.string(),
        landmark: z.string(),
        tin: z.string().optional(),
        payoutMethod: z.string(),
        payoutNumber: z.string().min(9),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const [row] = await db.insert(sellers).values({ ...input, status: "pending" }).$returningId();
        return { id: row.id };
      }),
    lookup: publicQuery.input(z.object({ phone: z.string().min(9) })).query(async ({ input }) => {
      const db = getDb();
      const phone = input.phone.trim();
      const [row] = await db.select().from(sellers).where(eq(sellers.phone, phone));
      if (!row) return null;
      const myListings = await db.select().from(listings).where(eq(listings.sellerId, row.id)).orderBy(desc(listings.createdAt));
      return { ...row, listings: myListings };
    }),
    addListing: publicQuery
      .input(z.object({
        phone: z.string().min(9),
        name: z.string().min(3),
        category: z.string().min(2),
        price: z.number().min(100),
        oldPrice: z.number().optional(),
        stock: z.number().min(1).max(10000),
        condition: z.enum(["new", "refurbished", "used"]),
        warrantyMonths: z.number().min(0).max(60),
        imageNote: z.string().min(2),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const [seller] = await db.select().from(sellers).where(eq(sellers.phone, input.phone.trim()));
        if (!seller) throw new Error("No shop registered with this phone number. Register your shop first.");
        if (seller.status !== "approved") throw new Error("Your shop must be approved before you can list items.");
        const [row] = await db.insert(listings).values({
          sellerId: seller.id,
          name: input.name,
          category: input.category,
          price: input.price,
          oldPrice: input.oldPrice ?? null,
          stock: input.stock,
          condition: input.condition,
          warrantyMonths: input.condition === "new" ? 0 : input.warrantyMonths,
          imageNote: input.imageNote,
          status: "pending",
        }).$returningId();
        return { id: row.id };
      }),
  }),

  affiliates: createRouter({
    join: publicQuery
      .input(z.object({ name: z.string().min(2), phone: z.string().min(9), channel: z.string() }))
      .mutation(async ({ input }) => {
        const db = getDb();
        const code = "AFF-" + Math.random().toString(36).slice(2, 8).toUpperCase();
        await db.insert(affiliates).values({ ...input, code });
        return { code };
      }),
  }),
});

export type AppRouter = typeof appRouter;
