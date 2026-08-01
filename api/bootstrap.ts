// One-time database bootstrap: creates tables and loads starter data.
// Called once after pointing DATABASE_URL at a fresh database; safe to re-run.
import { z } from "zod";
import { sql } from "drizzle-orm";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { runSeed } from "../db/seed";

const BOOTSTRAP_KEY = "ugsouq-setup-2026";

const TABLES = [
  `CREATE TABLE IF NOT EXISTS sellers (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`shop_name\` varchar(255) NOT NULL, \`owner_name\` varchar(255) NOT NULL, \`phone\` varchar(32) NOT NULL,
    \`email\` varchar(255), \`id_type\` varchar(64), \`id_number\` varchar(64), \`id_photo_name\` varchar(255),
    \`district\` varchar(64), \`landmark\` varchar(255), \`tin\` varchar(32),
    \`payout_method\` varchar(32), \`payout_number\` varchar(32),
    \`verified\` boolean NOT NULL DEFAULT false, \`rating\` int NOT NULL DEFAULT 45,
    \`status\` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`seller_id\` bigint unsigned NOT NULL, \`name\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL,
    \`category\` varchar(64) NOT NULL, \`price\` int NOT NULL, \`old_price\` int, \`image\` varchar(255) NOT NULL,
    \`stock\` int NOT NULL DEFAULT 0, \`condition\` enum('new','refurbished','used') NOT NULL DEFAULT 'new',
    \`warranty_months\` int NOT NULL DEFAULT 0, \`flash_sale\` boolean NOT NULL DEFAULT false,
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS listings (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`seller_id\` bigint unsigned NOT NULL, \`name\` varchar(255) NOT NULL, \`category\` varchar(64) NOT NULL,
    \`price\` int NOT NULL, \`old_price\` int, \`stock\` int NOT NULL DEFAULT 1,
    \`condition\` enum('new','refurbished','used') NOT NULL DEFAULT 'new',
    \`warranty_months\` int NOT NULL DEFAULT 0, \`image_note\` varchar(255) NOT NULL,
    \`image_data\` mediumtext,
    \`status\` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS restaurants (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`name\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`cuisine\` varchar(128) NOT NULL,
    \`area\` varchar(128) NOT NULL, \`delivery_mins\` int NOT NULL DEFAULT 35, \`delivery_fee\` int NOT NULL DEFAULT 3000,
    \`min_order\` int NOT NULL DEFAULT 10000, \`rating\` int NOT NULL DEFAULT 45, \`image\` varchar(255) NOT NULL,
    \`open\` boolean NOT NULL DEFAULT true, \`featured\` boolean NOT NULL DEFAULT false,
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS menu_items (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`restaurant_id\` bigint unsigned NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text,
    \`price\` int NOT NULL, \`image\` varchar(255), \`popular\` boolean NOT NULL DEFAULT false,
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`code\` varchar(16) NOT NULL, \`customer_name\` varchar(255) NOT NULL, \`phone\` varchar(32) NOT NULL,
    \`address\` text NOT NULL, \`payment_method\` enum('mtn_momo','airtel_money','cash') NOT NULL,
    \`subtotal\` int NOT NULL, \`delivery_fee\` int NOT NULL DEFAULT 0, \`total\` int NOT NULL,
    \`status\` enum('placed','confirmed','on_the_way','delivered','cancelled') NOT NULL DEFAULT 'placed',
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`order_id\` bigint unsigned NOT NULL, \`item_type\` enum('product','menu_item') NOT NULL,
    \`item_id\` bigint unsigned NOT NULL, \`name\` varchar(255) NOT NULL, \`price\` int NOT NULL, \`qty\` int NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`name\` varchar(255) NOT NULL, \`phone\` varchar(32) NOT NULL,
    \`location\` text,
    \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS affiliates (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
    \`name\` varchar(255) NOT NULL, \`phone\` varchar(32) NOT NULL, \`channel\` varchar(64) NOT NULL,
    \`code\` varchar(16) NOT NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

// Column upgrades for existing tables (ignored when the column already exists)
const ALTERS = [
  "ALTER TABLE orders ADD COLUMN \`payment_status\` enum('unpaid','pending_confirmation','paid') NOT NULL DEFAULT 'unpaid'",
  "ALTER TABLE orders ADD COLUMN \`payment_ref\` varchar(64) NULL",
];

export const bootstrapRouter = createRouter({
  setup: publicQuery
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      if (input.key !== BOOTSTRAP_KEY) throw new Error("Invalid setup key");
      const db = getDb();
      // DDL must use the text protocol (mysql2 .query), not prepared statements (.execute)
      const raw: any = (db as any).$client;
      const client: any = typeof raw.promise === "function" ? raw.promise() : raw;
      for (const stmt of TABLES) {
        await client.query(stmt);
      }
      for (const stmt of ALTERS) {
        try { await client.query(stmt); } catch (e: any) { if (e?.errno !== 1060) throw e; } // 1060 = duplicate column
      }
      const [countRows]: any = await db.execute(sql.raw("SELECT COUNT(*) AS n FROM products"));
      const rows = Array.isArray(countRows) ? countRows : [countRows];
      const n = Number(rows[0]?.n ?? 0);
      let seeded = false;
      if (n === 0) {
        await runSeed();
        seeded = true;
      }
      const [after]: any = await db.execute(sql.raw(
        "SELECT (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM sellers) AS sellers, (SELECT COUNT(*) FROM restaurants) AS restaurants, (SELECT COUNT(*) FROM menu_items) AS menu_items"
      ));
      const summary = Array.isArray(after) ? after[0] : after;
      return { ok: true, seeded, ...summary };
    }),
});
