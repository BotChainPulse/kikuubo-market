import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { createRouter, publicQuery, COMMISSION_RATE } from "./middleware";
import { getDb } from "./queries/connection";
import { sellers, orders, orderItems, affiliates, products, listings, payouts } from "../db/schema";
import axios from "axios";

// Change this key (or set ADMIN_KEY in the environment) before going public.
const ADMIN_KEY = process.env.ADMIN_KEY ?? "ugsouq-admin-2026";

function requireAdmin(key: string) {
  if (key !== ADMIN_KEY) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin key" });
}

const ORDER_STATUSES = ["placed", "confirmed", "on_the_way", "delivered", "cancelled"] as const;

const FLW_SECRET = process.env.FLW_SECRET_KEY!;
const FLW_BASE = "https://api.flutterwave.com/v3";

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

  setPaymentStatus: publicQuery
    .input(z.object({ key: z.string(), id: z.number(), status: z.enum(["unpaid", "pending_confirmation", "paid"]) }))
    .mutation(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      await db.update(orders).set({ paymentStatus: input.status }).where(eq(orders.id, input.id));
      return { ok: true };
    }),

  accounts: publicQuery.input(z.object({ key: z.string() })).query(async ({ input }) => {
    requireAdmin(input.key);
    const db = getDb();
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(500);
    const active = rows.filter((o) => o.status !== "cancelled");
    const paid = active.filter((o) => o.paymentStatus === "paid");
    const entries = active.map((o) => ({
      id: o.id,
      code: o.code,
      date: o.createdAt,
      customer: o.customerName,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      commission: o.commissionFee,
      sellerPayout: o.subtotal - o.commissionFee,
      total: o.total,
    }));
    return {
      rate: COMMISSION_RATE,
      totals: {
        orders: active.length,
        sales: active.reduce((s, o) => s + o.subtotal, 0),
        deliveryFees: active.reduce((s, o) => s + o.deliveryFee, 0),
        commissionEarned: active.reduce((s, o) => s + o.commissionFee, 0),
        sellerPayoutsOwed: active.reduce((s, o) => s + (o.subtotal - o.commissionFee), 0),
        receivedFromBuyers: paid.reduce((s, o) => s + o.total, 0),
        awaitingBuyerPayment: active.filter((o) => o.paymentStatus !== "paid").reduce((s, o) => s + o.total, 0),
      },
      entries,
    };
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
      await db.update(listings).set({ status: input.status }).where(eq(listings.id, input.id));
      return { ok: true };
    }),

  // ============================================
  // ⬇️ PAYOUT QUERIES — ADD THIS ENTIRE SECTION
  // ============================================
  
  pendingPayouts: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      
      // Get all delivered, paid, not-yet-paid-out orders grouped by seller
      const result = await db.execute(`
        SELECT 
          s.id as seller_id,
          s.shop_name as seller_name,
          s.payout_method,
          s.payout_number,
          COALESCE(SUM(o.subtotal - o.commission_fee), 0) as total_owed,
          STRING_AGG(o.code, ',') as order_codes,
          COUNT(o.id) as order_count
        FROM sellers s
        JOIN orders o ON o.seller_id = s.id
        WHERE o.status = 'delivered' 
          AND o.payment_status = 'paid'
          AND (o.paid_out = false OR o.paid_out IS NULL)
        GROUP BY s.id, s.shop_name, s.payout_method, s.payout_number
        HAVING SUM(o.subtotal - o.commission_fee) > 0
        ORDER BY total_owed DESC
      `);

      return { success: true, pending: result.rows };
    }),

  sendPayout: publicQuery
    .input(z.object({
      key: z.string(),
      sellerId: z.number(),
      amount: z.number(),
      orderCodes: z.string(),
      payoutMethod: z.string(),
      payoutNumber: z.string(),
      sellerName: z.string(),
    }))
    .mutation(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();

      const reference = `UGS-PAYOUT-${input.sellerId}-${Date.now()}`;

      const getBankCode = (method: string) => {
        const m = method?.toLowerCase() || "";
        if (m.includes("airtel")) return "MPS";
        return "MPS"; // MTN default
      };

      const cleanNumber = input.payoutNumber.replace(/\D/g, "").replace(/^0/, "256");

      try {
        const response = await axios.post(
          `${FLW_BASE}/transfers`,
          {
            account_bank: getBankCode(input.payoutMethod),
            account_number: cleanNumber,
            amount: Math.round(input.amount),
            currency: "UGX",
            narration: `UG Souq payout to ${input.sellerName}`,
            reference: reference,
            callback_url: `${process.env.APP_URL}/api/trpc/admin.payoutWebhook`,
            meta: [
              { seller_id: input.sellerId },
              { order_codes: input.orderCodes }
            ]
          },
          {
            headers: {
              Authorization: `Bearer ${FLW_SECRET}`,
              "Content-Type": "application/json"
            }
          }
        );

        const flwData = response.data.data;

        // Record payout
        await db.insert(payouts).values({
          sellerId: input.sellerId,
          orderIds: input.orderCodes,
          amount: input.amount.toString(),
          commission: "0",
          flutterwaveFee: (flwData.fee || 0).toString(),
          status: flwData.status === "NEW" ? "processing" : flwData.status.toLowerCase(),
          flutterwaveTransferId: flwData.id?.toString(),
          flutterwaveReference: reference,
        });

        // Mark orders as paid out
        const codes = input.orderCodes.split(",");
        for (const code of codes) {
          await db.update(orders)
            .set({ paidOut: true, payoutRef: reference })
            .where(eq(orders.code, code.trim()));
        }

        return {
          success: true,
          message: "Payout initiated",
          reference,
          flutterwaveStatus: flwData.status
        };

      } catch (error: any) {
        console.error("Payout error:", error.response?.data || error.message);
        
        await db.insert(payouts).values({
          sellerId: input.sellerId,
          orderIds: input.orderCodes,
          amount: input.amount.toString(),
          commission: "0",
          status: "failed",
          flutterwaveReference: reference,
          failureReason: error.response?.data?.message || error.message,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.response?.data?.message || "Payout failed"
        });
      }
    }),

  payoutHistory: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      const rows = await db.select().from(payouts).orderBy(desc(payouts.createdAt));
      return { success: true, payouts: rows };
    }),

  payoutWebhook: publicQuery
    .input(z.any())
    .mutation(async ({ input }) => {
      const payload = input;
      
      if (payload.event === "transfer.completed") {
        const data = payload.data;
        const reference = data.reference;

        const newStatus = data.status === "SUCCESSFUL" ? "paid" : 
                          data.status === "FAILED" ? "failed" : "processing";

        await db.update(payouts)
          .set({
            status: newStatus,
            paidAt: newStatus === "paid" ? new Date() : undefined,
            failureReason: data.complete_message || undefined,
          })
          .where(eq(payouts.flutterwaveReference, reference));

        // If failed, revert orders so they can be retried
        if (newStatus === "failed") {
          await db.update(orders)
            .set({ paidOut: false, payoutRef: null })
            .where(eq(orders.payoutRef, reference));
        }
      }

      return { received: true };
    }),
});


