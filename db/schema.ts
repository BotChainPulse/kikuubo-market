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
  mediumtext,
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
  commissionTermsAccepted: boolean("commission_terms_accepted").notNull().default(false),
  sellerContractAccepted: boolean("seller_contract_accepted").notNull().default(false),
  commissionTermsAcceptedAt: timestamp("commission_terms_accepted_at"),
  sellerContractAcceptedAt: timestamp("seller_contract_accepted_at"),
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
  imageData: mediumtext("image_data"), // seller-uploaded photo, stored as data URL (Railway has no persistent disk)
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
  code: varchar("code", { length: 16 }).notNull(), // e.g. US-8F3K2
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  address: text("address").notNull(),
  paymentMethod: mysqlEnum("payment_method", ["mtn_momo", "airtel_money", "cash"]).notNull(),
  subtotal: int("subtotal").notNull(),
  deliveryFee: int("delivery_fee").notNull().default(0),
  total: int("total").notNull(),
  status: mysqlEnum("status", ["placed", "confirmed", "pending_delivery", "on_the_way", "delivered", "cancelled"]).notNull().default("placed"),
  paymentStatus: mysqlEnum("payment_status", ["unpaid", "pending_confirmation", "paid"]).notNull().default("unpaid"),
  paymentRef: varchar("payment_ref", { length: 64 }), // MoMo/Airtel transaction ID the buyer enters after sending money
  paidOut: boolean("paid_out").notNull().default(false),
  payoutRef: varchar("payout_ref", { length: 64 }),
  commissionFee: int("commission_fee").notNull().default(0), // UG Souq's cut of the subtotal (COMMISSION_RATE at order time)
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

export const customers = mysqlTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  location: text("location"), // delivery area / landmark for easy delivery
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const affiliates = mysqlTable("affiliates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  channel: varchar("channel", { length: 64 }).notNull(),
  code: varchar("code", { length: 16 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const deliveryPartners = mysqlTable("delivery_partners", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  area: varchar("area", { length: 128 }).notNull(),
  vehicleType: varchar("vehicle_type", { length: 64 }).notNull(),
  payoutMethod: varchar("payout_method", { length: 32 }).notNull(),
  payoutNumber: varchar("payout_number", { length: 32 }).notNull(),
  contractAccepted: boolean("contract_accepted").notNull().default(false),
  deliveryShareAccepted: boolean("delivery_share_accepted").notNull().default(false),
  contractAcceptedAt: timestamp("contract_accepted_at"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sellerAdBookings = mysqlTable("seller_ad_bookings", {
  id: serial("id").primaryKey(),
  sellerId: bigint("seller_id", { mode: "number", unsigned: true }).notNull(),
  planType: mysqlEnum("plan_type", ["weekly", "monthly"]).notNull(),
  amount: int("amount").notNull(),
  status: mysqlEnum("status", ["booked", "paid", "active", "completed", "cancelled"]).notNull().default("booked"),
  notes: varchar("notes", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminAuditLogs = mysqlTable("admin_audit_logs", {
  id: serial("id").primaryKey(),
  actorTag: varchar("actor_tag", { length: 32 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }).notNull(),
  beforeState: text("before_state"),
  afterState: text("after_state"),
  meta: text("meta"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
