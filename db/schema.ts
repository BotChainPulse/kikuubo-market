import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  int,
  boolean,
  timestamp,
  bigint,
} from "drizzle-orm/mysql-core";

export const sellers = mysqlTable("sellers", {
  id: serial("id").primaryKey(),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  ownerName: varchar("owner_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  email: varchar("email", { length: 255 }),
  idType: varchar("id_type", { length: 64 }),
  idNumber: varchar("id_number", { length: 64 }),
  idPhotoName: varchar("id_photo_name", { length: 255 }),
  district: varchar("district", { length: 64 }),
  landmark: varchar("landmark", { length: 255 }),
  tin: varchar("tin", { length: 32 }),
  payoutMethod: varchar("payout_method", { length: 32 }),
  payoutNumber: varchar("payout_number", { length: 32 }),
  verified: boolean("verified").notNull().default(false),
  rating: int("rating").notNull().default(45), // store rating ×10 (45 = 4.5)
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  sellerId: bigint("seller_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  price: int("price").notNull(), // UGX, whole shillings
  oldPrice: int("old_price"),
  image: varchar("image", { length: 255 }).notNull(),
  stock: int("stock").notNull().default(0),
  condition: mysqlEnum("condition", ["new", "refurbished", "used"]).notNull().default("new"),
  warrantyMonths: int("warranty_months").notNull().default(0),
  flashSale: boolean("flash_sale").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const listings = mysqlTable("listings", {
  id: serial("id").primaryKey(),
  sellerId: bigint("seller_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  price: int("price").notNull(),
  oldPrice: int("old_price"),
  stock: int("stock").notNull().default(1),
  condition: mysqlEnum("condition", ["new", "refurbished", "used"]).notNull().default("new"),
  warrantyMonths: int("warranty_months").notNull().default(0),
  imageNote: varchar("image_note", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const restaurants = mysqlTable("restaurants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  cuisine: varchar("cuisine", { length: 128 }).notNull(),
  area: varchar("area", { length: 128 }).notNull(),
  deliveryMins: int("delivery_mins").notNull().default(35),
  deliveryFee: int("delivery_fee").notNull().default(3000),
  minOrder: int("min_order").notNull().default(10000),
  rating: int("rating").notNull().default(45), // ×10
  image: varchar("image", { length: 255 }).notNull(),
  open: boolean("open").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const menuItems = mysqlTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: bigint("restaurant_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: int("price").notNull(),
  image: varchar("image", { length: 255 }),
  popular: boolean("popular").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 16 }).notNull(), // e.g. KB-8F3K2
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  address: text("address").notNull(),
  paymentMethod: mysqlEnum("payment_method", ["mtn_momo", "airtel_money", "cash"]).notNull(),
  subtotal: int("subtotal").notNull(),
  deliveryFee: int("delivery_fee").notNull().default(0),
  total: int("total").notNull(),
  status: mysqlEnum("status", ["placed", "confirmed", "on_the_way", "delivered", "cancelled"]).notNull().default("placed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = mysqlTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: bigint("order_id", { mode: "number", unsigned: true }).notNull(),
  itemType: mysqlEnum("item_type", ["product", "menu_item"]).notNull(),
  itemId: bigint("item_id", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: int("price").notNull(),
  qty: int("qty").notNull(),
});

export const affiliates = mysqlTable("affiliates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  channel: varchar("channel", { length: 64 }).notNull(),
  code: varchar("code", { length: 16 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
