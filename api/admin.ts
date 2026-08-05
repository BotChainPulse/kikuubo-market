import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { createHash } from "crypto";
import { createRouter, publicQuery, COMMISSION_RATE } from "./middleware";
import { getDb } from "./queries/connection";
import { sellers, orders, orderItems, affiliates, products, listings, sellerAdBookings, deliveryPartners, adminAuditLogs } from "../db/schema";

// Change this key (or set ADMIN_KEY in the environment) before going public.
const ADMIN_KEY = process.env.ADMIN_KEY ?? "ugsouq-admin-2026";

function requireAdmin(key: string) {
  if (key !== ADMIN_KEY) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin key" });
}

const ORDER_STATUSES = ["placed", "confirmed", "pending_delivery", "on_the_way", "delivered", "cancelled"] as const;

const FLW_SECRET = process.env.FLW_SECRET_KEY;
const FLW_BASE = "https://api.flutterwave.com/v3";

const normalizeUgPhone = (value: string) => {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("256")) return digits;
  if (digits.startsWith("0")) return `256${digits.slice(1)}`;
  return `256${digits}`;
};

const normalizeOrderCodes = (raw: string | string[]) => {
  const arr = Array.isArray(raw) ? raw : raw.split(",");
  return arr.map((x) => x.trim().toUpperCase()).filter(Boolean);
};

const actorTag = (key: string) => createHash("sha256").update(key).digest("hex").slice(0, 12);

async function writeAudit(params: {
  key: string;
  action: string;
  entityType: string;
  entityId: string | number;
  beforeState?: unknown;
  afterState?: unknown;
  meta?: unknown;
}) {
  const db = getDb();
  await db.insert(adminAuditLogs).values({
    actorTag: actorTag(params.key),
    action: params.action,
    entityType: params.entityType,
    entityId: String(params.entityId),
    beforeState: params.beforeState === undefined ? null : JSON.stringify(params.beforeState),
    afterState: params.afterState === undefined ? null : JSON.stringify(params.afterState),
    meta: params.meta === undefined ? null : JSON.stringify(params.meta),
  });
}

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
      const [before] = await db.select().from(sellers).where(eq(sellers.id, input.id));
      await db.update(sellers).set({
        status: input.status,
        verified: input.status === "approved",
      }).where(eq(sellers.id, input.id));
      const [after] = await db.select().from(sellers).where(eq(sellers.id, input.id));
      await writeAudit({
        key: input.key,
        action: "seller.status.changed",
        entityType: "seller",
        entityId: input.id,
        beforeState: before,
        afterState: after,
      });
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
      const [before] = await db.select().from(orders).where(eq(orders.id, input.id));
      await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));
      const [after] = await db.select().from(orders).where(eq(orders.id, input.id));
      await writeAudit({
        key: input.key,
        action: "order.status.changed",
        entityType: "order",
        entityId: input.id,
        beforeState: before,
        afterState: after,
      });
      return { ok: true };
    }),

  setPaymentStatus: publicQuery
    .input(z.object({ key: z.string(), id: z.number(), status: z.enum(["unpaid", "pending_confirmation", "paid"]) }))
    .mutation(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      const [before] = await db.select().from(orders).where(eq(orders.id, input.id));
      await db.update(orders).set({ paymentStatus: input.status }).where(eq(orders.id, input.id));
      const [after] = await db.select().from(orders).where(eq(orders.id, input.id));
      await writeAudit({
        key: input.key,
        action: "order.payment_status.changed",
        entityType: "order",
        entityId: input.id,
        beforeState: before,
        afterState: after,
      });
      return { ok: true };
    }),

  deliveryPartners: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      const partners = await db.select().from(deliveryPartners).orderBy(desc(deliveryPartners.createdAt));
      const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(500);
      const active = orderRows.filter((o) => o.status !== "cancelled");
      const paid = active.filter((o) => o.paymentStatus === "paid");
      const platform10Booked = active.reduce((s, o) => s + Math.round(o.deliveryFee * 0.1), 0);
      const platform10Realized = paid.reduce((s, o) => s + Math.round(o.deliveryFee * 0.1), 0);

      return {
        partners,
        ledger: {
          deliveryFeesBooked: active.reduce((s, o) => s + o.deliveryFee, 0),
          deliveryFeesRealized: paid.reduce((s, o) => s + o.deliveryFee, 0),
          platform10Booked,
          platform10Realized,
          partnerShareBooked: active.reduce((s, o) => s + (o.deliveryFee - Math.round(o.deliveryFee * 0.1)), 0),
          partnerShareRealized: paid.reduce((s, o) => s + (o.deliveryFee - Math.round(o.deliveryFee * 0.1)), 0),
        },
      };
    }),

  setDeliveryPartnerStatus: publicQuery
    .input(z.object({ key: z.string(), id: z.number(), status: z.enum(["pending", "approved", "rejected"]) }))
    .mutation(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      const [before] = await db.select().from(deliveryPartners).where(eq(deliveryPartners.id, input.id));
      await db.update(deliveryPartners).set({ status: input.status }).where(eq(deliveryPartners.id, input.id));
      const [after] = await db.select().from(deliveryPartners).where(eq(deliveryPartners.id, input.id));
      await writeAudit({
        key: input.key,
        action: "delivery_partner.status.changed",
        entityType: "delivery_partner",
        entityId: input.id,
        beforeState: before,
        afterState: after,
      });
      return { ok: true };
    }),

  adBookings: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      const rows = await db
        .select({ booking: sellerAdBookings, seller: sellers })
        .from(sellerAdBookings)
        .innerJoin(sellers, eq(sellerAdBookings.sellerId, sellers.id))
        .orderBy(desc(sellerAdBookings.createdAt));

      const list = rows.map(({ booking, seller }) => ({
        ...booking,
        sellerName: seller.shopName,
        sellerPhone: seller.phone,
      }));
      const totals = {
        booked: list.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.amount, 0),
        realized: list.filter((r) => ["paid", "active", "completed"].includes(r.status)).reduce((s, r) => s + r.amount, 0),
        count: list.length,
      };

      return { rows: list, totals };
    }),

  setAdBookingStatus: publicQuery
    .input(z.object({ key: z.string(), id: z.number(), status: z.enum(["booked", "paid", "active", "completed", "cancelled"]) }))
    .mutation(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      const [before] = await db.select().from(sellerAdBookings).where(eq(sellerAdBookings.id, input.id));
      await db.update(sellerAdBookings).set({ status: input.status }).where(eq(sellerAdBookings.id, input.id));
      const [after] = await db.select().from(sellerAdBookings).where(eq(sellerAdBookings.id, input.id));
      await writeAudit({
        key: input.key,
        action: "seller_ad_booking.status.changed",
        entityType: "seller_ad_booking",
        entityId: input.id,
        beforeState: before,
        afterState: after,
      });
      return { ok: true };
    }),

  auditLog: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();
      return db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(300);
    }),

  accounts: publicQuery.input(z.object({ key: z.string() })).query(async ({ input }) => {
    requireAdmin(input.key);
    const db = getDb();
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(500);
    const adRows = await db.select().from(sellerAdBookings).orderBy(desc(sellerAdBookings.createdAt)).limit(500);
    const active = rows.filter((o) => o.status !== "cancelled");
    const paid = active.filter((o) => o.paymentStatus === "paid");
    const deliveryIncomeBooked = active.reduce((s, o) => s + Math.round(o.deliveryFee * 0.1), 0);
    const deliveryIncomeRealized = paid.reduce((s, o) => s + Math.round(o.deliveryFee * 0.1), 0);
    const adBooked = adRows.filter((a) => a.status !== "cancelled").reduce((s, a) => s + a.amount, 0);
    const adRealized = adRows.filter((a) => ["paid", "active", "completed"].includes(a.status)).reduce((s, a) => s + a.amount, 0);
    const commissionBooked = active.reduce((s, o) => s + o.commissionFee, 0);
    const commissionRealized = paid.reduce((s, o) => s + o.commissionFee, 0);
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
        commissionEarned: commissionBooked,
        commissionRealized,
        commissionBooked,
        deliveryIncome10pctBooked: deliveryIncomeBooked,
        deliveryIncome10pctRealized: deliveryIncomeRealized,
        adRevenueBooked: adBooked,
        adRevenueRealized: adRealized,
        grossPlatformIncomeBooked: commissionBooked + deliveryIncomeBooked + adBooked,
        grossPlatformIncomeRealized: commissionRealized + deliveryIncomeRealized + adRealized,
        sellerPayoutsOwed: active.reduce((s, o) => s + (o.subtotal - o.commissionFee), 0),
        receivedFromBuyers: paid.reduce((s, o) => s + o.total, 0),
        awaitingBuyerPayment: active.filter((o) => o.paymentStatus !== "paid").reduce((s, o) => s + o.total, 0),
      },
      incomeStreams: [
        { stream: "Product commission", booked: commissionBooked, realized: commissionRealized, rule: `${Math.round(COMMISSION_RATE * 100)}% of product subtotal` },
        { stream: "Delivery income", booked: deliveryIncomeBooked, realized: deliveryIncomeRealized, rule: "10% of delivery fee" },
        { stream: "Seller ad revenue", booked: adBooked, realized: adRealized, rule: "Weekly UGX 25,000 / Monthly UGX 50,000" },
      ],
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
      const [before] = await db.select().from(listings).where(eq(listings.id, input.id));
      await db.update(listings).set({ status: input.status }).where(eq(listings.id, input.id));
      const [after] = await db.select().from(listings).where(eq(listings.id, input.id));
      await writeAudit({
        key: input.key,
        action: "listing.status.changed",
        entityType: "listing",
        entityId: input.id,
        beforeState: before,
        afterState: after,
      });
      return { ok: true };
    }),

  // ============================================
  // PAYOUTS
  // ============================================

  pendingPayouts: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();

      const eligibleOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.status, "delivered"),
            eq(orders.paymentStatus, "paid"),
            eq(orders.paidOut, false),
          ),
        )
        .orderBy(desc(orders.createdAt));

      if (eligibleOrders.length === 0) return { success: true, pending: [] as any[] };

      const sellerRows = await db.select().from(sellers);
      const sellerById = new Map(sellerRows.map((s) => [Number(s.id), s]));

      const productRows = await db.select().from(products);
      const productById = new Map(productRows.map((p) => [Number(p.id), p]));

      const grouped = new Map<
        number,
        {
          sellerId: number;
          sellerName: string;
          payoutMethod: string | null;
          payoutNumber: string | null;
          totalOwed: number;
          orderCodeSet: Set<string>;
        }
      >();

      for (const order of eligibleOrders) {
        const items = await db
          .select()
          .from(orderItems)
          .where(and(eq(orderItems.orderId, order.id), eq(orderItems.itemType, "product")));

        if (items.length === 0) continue;

        const perSellerGross = new Map<number, number>();
        let grossTotal = 0;

        for (const it of items) {
          const product = productById.get(Number(it.itemId));
          if (!product) continue;

          const lineTotal = Number(it.price) * Number(it.qty);
          grossTotal += lineTotal;

          const sid = Number(product.sellerId);
          perSellerGross.set(sid, (perSellerGross.get(sid) ?? 0) + lineTotal);
        }

        if (grossTotal <= 0) continue;

        for (const [sid, sellerGross] of perSellerGross.entries()) {
          const seller = sellerById.get(sid);
          if (!seller) continue;

          const allocatedCommission = Math.round(
            (sellerGross / grossTotal) * Number(order.commissionFee ?? 0),
          );
          const payoutNet = sellerGross - allocatedCommission;
          if (payoutNet <= 0) continue;

          const row = grouped.get(sid);
          if (!row) {
            grouped.set(sid, {
              sellerId: sid,
              sellerName: seller.shopName,
              payoutMethod: seller.payoutMethod ?? null,
              payoutNumber: seller.payoutNumber ?? null,
              totalOwed: payoutNet,
              orderCodeSet: new Set([order.code]),
            });
          } else {
            row.totalOwed += payoutNet;
            row.orderCodeSet.add(order.code);
          }
        }
      }

      const pending = Array.from(grouped.values())
        .map((x) => {
          const codes = Array.from(x.orderCodeSet);
          return {
            seller_id: x.sellerId,
            seller_name: x.sellerName,
            payout_method: x.payoutMethod,
            payout_number: x.payoutNumber,
            total_owed: x.totalOwed,
            order_count: codes.length,
            order_codes: codes,
          };
        })
        .sort((a, b) => b.total_owed - a.total_owed);

      return { success: true, pending };
    }),

  sendPayout: publicQuery
    .input(z.object({
      key: z.string(),
      sellerId: z.number(),
      amount: z.number().positive(),
      orderCodes: z.union([z.string(), z.array(z.string())]),
      payoutMethod: z.string(),
      payoutNumber: z.string(),
      sellerName: z.string(),
    }))
    .mutation(async ({ input }) => {
      requireAdmin(input.key);
      const db = getDb();

      if (!FLW_SECRET) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "FLW_SECRET_KEY is missing in environment variables.",
        });
      }

      const reference = `UGS-PAYOUT-${input.sellerId}-${Date.now()}`;

      const accountNumber = normalizeUgPhone(input.payoutNumber);
      const orderCodes = normalizeOrderCodes(input.orderCodes);

      if (!accountNumber) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid payout number.",
        });
      }

      const res = await fetch(`${FLW_BASE}/transfers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FLW_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_bank: "MPS",
          account_number: accountNumber,
          amount: Math.round(input.amount),
          currency: "UGX",
          narration: `UG Souq payout to ${input.sellerName}`,
          reference,
          callback_url: `${process.env.APP_URL}/api/trpc/admin.payoutWebhook`,
          meta: [{ seller_id: input.sellerId }, { order_codes: orderCodes }],
        }),
      });

      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok || payload?.status !== "success") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: payload?.message || "Payout failed",
        });
      }

      for (const code of orderCodes) {
        await db
          .update(orders)
          .set({ paidOut: true, payoutRef: reference })
          .where(eq(orders.code, code));
      }

      await writeAudit({
        key: input.key,
        action: "payout.initiated",
        entityType: "seller",
        entityId: input.sellerId,
        meta: {
          sellerName: input.sellerName,
          amount: Math.round(input.amount),
          orderCodes,
          payoutMethod: input.payoutMethod,
          payoutNumber: input.payoutNumber,
          reference,
        },
      });

      return {
        success: true,
        message: "Payout initiated",
        reference,
        flutterwaveStatus: payload?.data?.status ?? "NEW",
      };
    }),

  payoutHistory: publicQuery
    .input(z.object({ key: z.string() }))
    .query(({ input }) => {
      requireAdmin(input.key);
      return { success: true, payouts: [] as any[] };
    }),

  payoutWebhook: publicQuery
    .input(z.any())
    .mutation(async ({ input }) => {
      const db = getDb();
      const payload = input;

      if (payload?.event === "transfer.completed") {
        const data = payload?.data;
        const reference = String(data?.reference ?? "");
        const status = String(data?.status ?? "").toUpperCase();

        if (reference && status !== "SUCCESSFUL") {
          await db
            .update(orders)
            .set({ paidOut: false, payoutRef: null })
            .where(eq(orders.payoutRef, reference));
          await db.insert(adminAuditLogs).values({
            actorTag: "system-webhook",
            action: "payout.webhook.rollback",
            entityType: "payout_reference",
            entityId: reference,
            meta: JSON.stringify({ status, event: payload?.event ?? null }),
          });
        }
      }

      return { received: true };
    }),
});


