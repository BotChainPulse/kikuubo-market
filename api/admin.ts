import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { sellers, orders, orderItems, affiliates, products, listings } from "../db/schema";

// Change this key (or set ADMIN_KEY in the environment) before going public.
const ADMIN_KEY = process.env.ADMIN_KEY ?? "ugsouq-admin-2026";

function requireAdmin(key: string) {
  if (key !== ADMIN_KEY) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin key" });
}

const ORDER_STATUSES = ["placed", "confirmed", "on_the_way", "delivered", "cancelled"] as const;

export const adminRouter = createRouter({
  login: publicQuery.input(z.object({ key: z.string() })).mutation(({ input }) => {
    requireAdmin(input.key);
    return { ok: true };
  }),

  stats: publicQuery.input(z.object({ key: z.string() })).query(async ({ input }) => {
    requireAdmin(input.key);
    const db = getDb();
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const allSellers = await db.select().from(sellers);
    const allAffiliates = await db.select().from(affiliates);
    const allProducts = await db.select().from(products);
    const active = allOrders.filter((o) => o.status !== "cancelled");
    return {
      orderCount: allOrders.length,
      revenue: active.reduce((s, o) => s + o.total, 0),
      sellerCount: allSellers.length,
      pendingSellers: allSellers.filter((s) => s.status === "pending").length,
      affiliateCount: allAffiliates.length,
      productCount: allProducts.length,
      ordersByStatus: ORDER_STATUSES.map((st) => ({ status: st, count: allOrders.filter((o) => o.status === st).length })),
    };
  }),

  sellers: publicQuery.input(z.object({ key: z.string() })).query(async ({ input }) => {
    requireAdmin(input.key);
    const db = getDb();
    const rows = await db.select().from(sellers).orderBy(desc(sellers.createdAt));
    return rows.sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0));
  }),

  setSellerStatus: publicQuery
    .input(z.object({ key: z.string(), id: z.number(), status: z.enum(["pending", "approved", "rejected"]) }))
    .mutation(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      await db.update(sellers).set({
        status: input.status,
        verified: input.status === "approved",
      }).where(eq(sellers.id, input.id));
      return { ok: true };
    }),

  orders: publicQuery.input(z.object({ key: z.string() })).query(async ({ input }) => {
    requireAdmin(input.key);
    const db = getDb();
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
    const withItems = await Promise.all(
      rows.map(async (o) => ({
        ...o,
        items: await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
      })),
    );
    return withItems;
  }),

  setOrderStatus: publicQuery
    .input(z.object({ key: z.string(), id: z.number(), status: z.enum(ORDER_STATUSES) }))
    .mutation(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      return { ok: true };
    }),

  // Admin verifies the MoMo/Airtel transaction ID on their phone, then marks the order paid
  setPaymentStatus: publicQuery
    .input(z.object({ key: z.string(), id: z.number(), status: z.enum(["unpaid", "pending_confirmation", "paid"]) }))
    .mutation(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      await db.update(orders).set({ paymentStatus: input.status }).where(eq(orders.id, input.id));
      return { ok: true };
    }),

  affiliates: publicQuery.input(z.object({ key: z.string() })).query(async ({ input }) => {
    requireAdmin(input.key);
    const db = getDb();
    return db.select().from(affiliates).orderBy(desc(affiliates.createdAt));
  }),

  listings: publicQuery.input(z.object({ key: z.string() })).query(async ({ input }) => {
    requireAdmin(input.key);
    const db = getDb();
    const rows = await db
      .select({ listing: listings, seller: sellers })
      .from(listings)
      .innerJoin(sellers, eq(listings.sellerId, sellers.id))
      .orderBy(desc(listings.createdAt));
    return rows
      .map(({ listing, seller }) => ({ ...listing, sellerName: seller.shopName, sellerVerified: seller.verified }))
      .sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0));
  }),

  setListingStatus: publicQuery
    .input(z.object({ key: z.string(), id: z.number(), status: z.enum(["pending", "approved", "rejected"]) }))
    .mutation(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      // Approved listings go live on the market directly (Catalog shows them with the seller's photo)
      await db.update(listings).set({ status: input.status }).where(eq(listings.id, input.id));
      return { ok: true };
    }),
});
