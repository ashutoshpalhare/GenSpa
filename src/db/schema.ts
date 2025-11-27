import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/* Shared column helpers                                                       */
/* -------------------------------------------------------------------------- */

const id = () => uuid("id").primaryKey().defaultRandom();

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

const softDelete = () => ({
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

/** Money is always NUMERIC(12,2) in PostgreSQL and handled as strings/integers in code. */
const money = (name: string) => numeric(name, { precision: 12, scale: 2 });

/* -------------------------------------------------------------------------- */
/* Enums                                                                       */
/* -------------------------------------------------------------------------- */

export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "SUSPENDED", "DEACTIVATED"]);
export const activeStatusEnum = pgEnum("active_status", ["ACTIVE", "INACTIVE"]);
export const publishStatusEnum = pgEnum("publish_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const authTokenTypeEnum = pgEnum("auth_token_type", ["EMAIL_VERIFICATION", "PASSWORD_RESET"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);
export const bookingSourceEnum = pgEnum("booking_source", ["WEB", "ADMIN", "PHONE", "WALK_IN"]);
export const membershipStatusEnum = pgEnum("membership_status", [
  "PENDING_PAYMENT",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
  "SUSPENDED",
]);
export const membershipTypeEnum = pgEnum("membership_type", ["TIME_BASED", "USAGE_BASED"]);
export const discountTypeEnum = pgEnum("discount_type", ["PERCENTAGE", "FIXED_AMOUNT"]);
export const couponScopeEnum = pgEnum("coupon_scope", ["ALL", "SERVICES", "PRODUCTS", "MEMBERSHIPS"]);
export const stockStatusEnum = pgEnum("stock_status", ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]);
export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
]);
export const paymentProviderEnum = pgEnum("payment_provider", [
  "RAZORPAY",
  "STRIPE",
  "PAYPAL",
  "CASH_AT_SPA",
  "MANUAL",
]);
export const paymentPurposeEnum = pgEnum("payment_purpose", ["BOOKING", "ORDER", "MEMBERSHIP"]);
export const refundStatusEnum = pgEnum("refund_status", ["PENDING", "PROCESSED", "FAILED"]);
export const reviewStatusEnum = pgEnum("review_status", ["PENDING", "APPROVED", "REJECTED"]);
export const messageStatusEnum = pgEnum("message_status", ["NEW", "READ", "REPLIED", "ARCHIVED"]);
export const subscriberStatusEnum = pgEnum("subscriber_status", ["SUBSCRIBED", "UNSUBSCRIBED"]);
export const notificationChannelEnum = pgEnum("notification_channel", [
  "IN_APP",
  "EMAIL",
  "WHATSAPP",
  "SMS",
]);
export const notificationStatusEnum = pgEnum("notification_status", [
  "PENDING",
  "SENT",
  "FAILED",
  "READ",
]);

/* -------------------------------------------------------------------------- */
/* Identity & RBAC                                                             */
/* -------------------------------------------------------------------------- */

export const users = pgTable("users", {
  id: id(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull().default(""),
  phone: varchar("phone", { length: 20 }),
  avatarUrl: text("avatar_url"),
  status: userStatusEnum("status").notNull().default("ACTIVE"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
  ...timestamps(),
  ...softDelete(),
});

export const roles = pgTable("roles", {
  id: id(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(true),
  ...timestamps(),
});

export const permissions = pgTable("permissions", {
  id: id(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  module: varchar("module", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    assignedByUserId: uuid("assigned_by_user_id").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: id(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: authTokenTypeEnum("type").notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_tokens_user_type_idx").on(t.userId, t.type)],
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: id(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    familyId: uuid("family_id").notNull(),
    tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    replacedById: uuid("replaced_by_id"),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (t) => [index("refresh_tokens_user_idx").on(t.userId), index("refresh_tokens_family_idx").on(t.familyId)],
);

/* -------------------------------------------------------------------------- */
/* Branches & Staff                                                            */
/* -------------------------------------------------------------------------- */

export type OpeningHours = Record<
  "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
  { open: string; close: string; closed: boolean }
>;

export const branches = pgTable("branches", {
  id: id(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  addressLine1: varchar("address_line1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  pincode: varchar("pincode", { length: 6 }).notNull(),
  country: varchar("country", { length: 2 }).notNull().default("IN"),
  latitude: numeric("latitude", { precision: 9, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Kolkata"),
  openingHours: jsonb("opening_hours").$type<OpeningHours>(),
  description: text("description"),
  imageUrl: text("image_url"),
  status: activeStatusEnum("status").notNull().default("ACTIVE"),
  ...timestamps(),
  ...softDelete(),
});

export const branchHolidays = pgTable(
  "branch_holidays",
  {
    id: id(),
    branchId: uuid("branch_id").references(() => branches.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    holidayDate: date("holiday_date", { mode: "string" }).notNull(),
    isClosed: boolean("is_closed").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("branch_holidays_branch_date_idx").on(t.branchId, t.holidayDate)],
);

export const staffProfiles = pgTable("staff_profiles", {
  id: id(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 150 }).notNull(),
  jobTitle: varchar("job_title", { length: 100 }).notNull().default("Therapist"),
  bio: text("bio"),
  skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
  profileImageUrl: text("profile_image_url"),
  experienceYears: smallint("experience_years").notNull().default(0),
  isBookable: boolean("is_bookable").notNull().default(true),
  status: activeStatusEnum("status").notNull().default("ACTIVE"),
  ...timestamps(),
  ...softDelete(),
});

export const staffBranches = pgTable(
  "staff_branches",
  {
    staffProfileId: uuid("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(false),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.staffProfileId, t.branchId] }), index("staff_branches_branch_idx").on(t.branchId)],
);

/* -------------------------------------------------------------------------- */
/* Service catalogue                                                           */
/* -------------------------------------------------------------------------- */

export const serviceCategories = pgTable("service_categories", {
  id: id(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  status: activeStatusEnum("status").notNull().default("ACTIVE"),
  ...timestamps(),
});

export const services = pgTable(
  "services",
  {
    id: id(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    categoryId: uuid("category_id").references(() => serviceCategories.id, { onDelete: "set null" }),
    shortDescription: varchar("short_description", { length: 300 }),
    description: text("description"),
    featuredImageUrl: text("featured_image_url"),
    durationMinutes: integer("duration_minutes").notNull(),
    price: money("price").notNull(),
    discountPrice: money("discount_price"),
    bufferMinutes: integer("buffer_minutes").notNull().default(0),
    status: activeStatusEnum("status").notNull().default("ACTIVE"),
    isFeatured: boolean("is_featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    check("services_duration_positive", sql`${t.durationMinutes} > 0`),
    check("services_price_nonnegative", sql`${t.price} >= 0`),
    check("services_buffer_nonnegative", sql`${t.bufferMinutes} >= 0`),
    index("services_category_idx").on(t.categoryId),
    index("services_status_featured_idx").on(t.status, t.isFeatured),
  ],
);

export const serviceImages = pgTable(
  "service_images",
  {
    id: id(),
    serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    altText: varchar("alt_text", { length: 255 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("service_images_service_idx").on(t.serviceId)],
);

/** Branch-specific availability, duration and price overrides for a service. */
export const serviceBranches = pgTable(
  "service_branches",
  {
    serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    durationOverrideMinutes: integer("duration_override_minutes"),
    priceOverride: money("price_override"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.serviceId, t.branchId] }), index("service_branches_branch_idx").on(t.branchId)],
);

export const staffServices = pgTable(
  "staff_services",
  {
    staffProfileId: uuid("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.staffProfileId, t.serviceId] }), index("staff_services_service_idx").on(t.serviceId)],
);

/* -------------------------------------------------------------------------- */
/* Staff scheduling (minutes are local to the branch timezone)                 */
/* -------------------------------------------------------------------------- */

export const staffSchedules = pgTable(
  "staff_schedules",
  {
    id: id(),
    staffProfileId: uuid("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    dayOfWeek: smallint("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    ...timestamps(),
  },
  (t) => [
    check("staff_schedules_day_range", sql`${t.dayOfWeek} between 0 and 6`),
    check("staff_schedules_minute_range", sql`${t.startMinute} >= 0 and ${t.endMinute} <= 1440 and ${t.endMinute} > ${t.startMinute}`),
    index("staff_schedules_staff_day_idx").on(t.staffProfileId, t.dayOfWeek),
  ],
);

export const staffBreaks = pgTable(
  "staff_breaks",
  {
    id: id(),
    staffProfileId: uuid("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    dayOfWeek: smallint("day_of_week").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    label: varchar("label", { length: 60 }).notNull().default("Break"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("staff_breaks_minute_range", sql`${t.startMinute} >= 0 and ${t.endMinute} <= 1440 and ${t.endMinute} > ${t.startMinute}`),
    index("staff_breaks_staff_day_idx").on(t.staffProfileId, t.dayOfWeek),
  ],
);

export const staffTimeOffs = pgTable(
  "staff_time_offs",
  {
    id: id(),
    staffProfileId: uuid("staff_profile_id")
      .notNull()
      .references(() => staffProfiles.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    reason: varchar("reason", { length: 255 }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("staff_time_offs_range", sql`${t.endsAt} > ${t.startsAt}`),
    index("staff_time_offs_staff_range_idx").on(t.staffProfileId, t.startsAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Bookings                                                                    */
/* -------------------------------------------------------------------------- */

export const bookings = pgTable(
  "bookings",
  {
    id: id(),
    bookingNumber: varchar("booking_number", { length: 24 }).notNull().unique(),
    customerUserId: uuid("customer_user_id").references(() => users.id, { onDelete: "set null" }),
    customerName: varchar("customer_name", { length: 150 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
    branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "restrict" }),
    staffProfileId: uuid("staff_profile_id").notNull().references(() => staffProfiles.id, { onDelete: "restrict" }),
    /** Occupancy: [startsAt, occupiedUntil) is the blocked interval for the therapist. */
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    occupiedUntil: timestamp("occupied_until", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    bufferMinutes: integer("buffer_minutes").notNull().default(0),
    serviceNameSnapshot: varchar("service_name_snapshot", { length: 160 }).notNull(),
    unitPriceSnapshot: money("unit_price_snapshot").notNull(),
    discountAmount: money("discount_amount").notNull().default("0"),
    totalAmount: money("total_amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    /** Coupon reference is stored without FK to avoid a circular module import; validated in service layer. */
    couponId: uuid("coupon_id"),
    couponCodeSnapshot: varchar("coupon_code_snapshot", { length: 40 }),
    status: bookingStatusEnum("status").notNull().default("PENDING"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
    source: bookingSourceEnum("source").notNull().default("WEB"),
    notes: text("notes"),
    cancellationReason: text("cancellation_reason"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    rescheduledFromId: uuid("rescheduled_from_id").references((): AnyPgColumn => bookings.id, { onDelete: "set null" }),
    ...timestamps(),
  },
  (t) => [
    check("bookings_time_range", sql`${t.endsAt} > ${t.startsAt} and ${t.occupiedUntil} >= ${t.endsAt}`),
    check("bookings_total_nonnegative", sql`${t.totalAmount} >= 0`),
    index("bookings_branch_start_idx").on(t.branchId, t.startsAt),
    index("bookings_staff_start_idx").on(t.staffProfileId, t.startsAt),
    index("bookings_customer_idx").on(t.customerUserId),
    index("bookings_status_idx").on(t.status),
  ],
);

export const bookingStatusHistory = pgTable(
  "booking_status_history",
  {
    id: id(),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    fromStatus: bookingStatusEnum("from_status"),
    toStatus: bookingStatusEnum("to_status").notNull(),
    changedByUserId: uuid("changed_by_user_id").references(() => users.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("booking_status_history_booking_idx").on(t.bookingId)],
);

/** Temporary reservation of a slot while the customer completes checkout. */
export const slotHolds = pgTable(
  "slot_holds",
  {
    id: id(),
    staffProfileId: uuid("staff_profile_id").notNull().references(() => staffProfiles.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    occupiedUntil: timestamp("occupied_until", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    holderTokenHash: varchar("holder_token_hash", { length: 128 }).notNull(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("slot_holds_staff_start_idx").on(t.staffProfileId, t.startsAt), index("slot_holds_expiry_idx").on(t.expiresAt)],
);

/* -------------------------------------------------------------------------- */
/* Memberships                                                                 */
/* -------------------------------------------------------------------------- */

export const membershipPlans = pgTable("membership_plans", {
  id: id(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  type: membershipTypeEnum("type").notNull().default("TIME_BASED"),
  price: money("price").notNull(),
  durationDays: integer("duration_days"),
  sessionsIncluded: integer("sessions_included"),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  benefits: jsonb("benefits").$type<string[]>().notNull().default([]),
  status: activeStatusEnum("status").notNull().default("ACTIVE"),
  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps(),
  ...softDelete(),
});

export const membershipPlanServices = pgTable(
  "membership_plan_services",
  {
    planId: uuid("plan_id").notNull().references(() => membershipPlans.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
    /** null = unlimited within the membership validity window. */
    sessionsIncluded: integer("sessions_included"),
  },
  (t) => [primaryKey({ columns: [t.planId, t.serviceId] })],
);

export const memberships = pgTable(
  "memberships",
  {
    id: id(),
    membershipNumber: varchar("membership_number", { length: 24 }).notNull().unique(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    planId: uuid("plan_id").notNull().references(() => membershipPlans.id, { onDelete: "restrict" }),
    planNameSnapshot: varchar("plan_name_snapshot", { length: 150 }).notNull(),
    typeSnapshot: membershipTypeEnum("type_snapshot").notNull(),
    pricePaid: money("price_paid").notNull(),
    status: membershipStatusEnum("status").notNull().default("PENDING_PAYMENT"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    sessionsTotal: integer("sessions_total"),
    sessionsUsed: integer("sessions_used").notNull().default(0),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    activatedByUserId: uuid("activated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    autoRenew: boolean("auto_renew").notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    check("memberships_sessions_nonnegative", sql`${t.sessionsUsed} >= 0`),
    index("memberships_user_status_idx").on(t.userId, t.status),
    index("memberships_ends_at_idx").on(t.endsAt),
  ],
);

export const membershipUsages = pgTable(
  "membership_usages",
  {
    id: id(),
    membershipId: uuid("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    recordedByUserId: uuid("recorded_by_user_id").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [index("membership_usages_membership_idx").on(t.membershipId)],
);

/* -------------------------------------------------------------------------- */
/* E-commerce: catalogue, carts, orders                                        */
/* -------------------------------------------------------------------------- */

export const productCategories = pgTable("product_categories", {
  id: id(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  parentId: uuid("parent_id").references((): AnyPgColumn => productCategories.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  status: activeStatusEnum("status").notNull().default("ACTIVE"),
  ...timestamps(),
});

export const products = pgTable(
  "products",
  {
    id: id(),
    slug: varchar("slug", { length: 180 }).notNull().unique(),
    sku: varchar("sku", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 180 }).notNull(),
    brand: varchar("brand", { length: 120 }),
    categoryId: uuid("category_id").references(() => productCategories.id, { onDelete: "set null" }),
    shortDescription: varchar("short_description", { length: 300 }),
    description: text("description"),
    primaryImageUrl: text("primary_image_url"),
    price: money("price").notNull(),
    salePrice: money("sale_price"),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    stockStatus: stockStatusEnum("stock_status").notNull().default("IN_STOCK"),
    weightGrams: integer("weight_grams"),
    lengthCm: numeric("length_cm", { precision: 6, scale: 2 }),
    widthCm: numeric("width_cm", { precision: 6, scale: 2 }),
    heightCm: numeric("height_cm", { precision: 6, scale: 2 }),
    status: publishStatusEnum("status").notNull().default("DRAFT"),
    isFeatured: boolean("is_featured").notNull().default(false),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    check("products_price_nonnegative", sql`${t.price} >= 0`),
    check("products_stock_nonnegative", sql`${t.stockQuantity} >= 0`),
    index("products_category_idx").on(t.categoryId),
    index("products_status_featured_idx").on(t.status, t.isFeatured),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: id(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    altText: varchar("alt_text", { length: 255 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const coupons = pgTable(
  "coupons",
  {
    id: id(),
    code: varchar("code", { length: 40 }).notNull().unique(),
    description: text("description"),
    discountType: discountTypeEnum("discount_type").notNull(),
    discountValue: money("discount_value").notNull(),
    maxDiscountAmount: money("max_discount_amount"),
    minOrderAmount: money("min_order_amount").notNull().default("0"),
    scope: couponScopeEnum("scope").notNull().default("ALL"),
    usageLimit: integer("usage_limit"),
    perUserLimit: integer("per_user_limit"),
    usedCount: integer("used_count").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    status: activeStatusEnum("status").notNull().default("ACTIVE"),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [check("coupons_value_nonnegative", sql`${t.discountValue} >= 0`)],
);

export const couponUsages = pgTable(
  "coupon_usages",
  {
    id: id(),
    couponId: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    orderId: uuid("order_id"),
    bookingId: uuid("booking_id"),
    discountAmount: money("discount_amount").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("coupon_usages_coupon_user_idx").on(t.couponId, t.userId)],
);

export const carts = pgTable(
  "carts",
  {
    id: id(),
    userId: uuid("user_id").unique().references(() => users.id, { onDelete: "cascade" }),
    sessionToken: varchar("session_token", { length: 128 }).unique(),
    couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps(),
  },
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: id(),
    cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    ...timestamps(),
  },
  (t) => [
    check("cart_items_quantity_range", sql`${t.quantity} between 1 and 99`),
    uniqueIndex("cart_items_cart_product_unique").on(t.cartId, t.productId),
  ],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

export const addresses = pgTable(
  "addresses",
  {
    id: id(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 50 }).notNull().default("Home"),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    line1: varchar("line1", { length: 255 }).notNull(),
    line2: varchar("line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    pincode: varchar("pincode", { length: 6 }).notNull(),
    country: varchar("country", { length: 2 }).notNull().default("IN"),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

export const orders = pgTable(
  "orders",
  {
    id: id(),
    orderNumber: varchar("order_number", { length: 24 }).notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    customerName: varchar("customer_name", { length: 150 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
    shippingAddress: jsonb("shipping_address").$type<Record<string, string>>().notNull(),
    subtotal: money("subtotal").notNull(),
    discountTotal: money("discount_total").notNull().default("0"),
    shippingTotal: money("shipping_total").notNull().default("0"),
    taxTotal: money("tax_total").notNull().default("0"),
    grandTotal: money("grand_total").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    couponCodeSnapshot: varchar("coupon_code_snapshot", { length: 40 }),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
    trackingCarrier: varchar("tracking_carrier", { length: 80 }),
    trackingNumber: varchar("tracking_number", { length: 80 }),
    notes: text("notes"),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    ...timestamps(),
  },
  (t) => [
    check("orders_total_nonnegative", sql`${t.grandTotal} >= 0`),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_placed_idx").on(t.placedAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    productNameSnapshot: varchar("product_name_snapshot", { length: 180 }).notNull(),
    skuSnapshot: varchar("sku_snapshot", { length: 64 }).notNull(),
    unitPriceSnapshot: money("unit_price_snapshot").notNull(),
    quantity: integer("quantity").notNull(),
    lineSubtotal: money("line_subtotal").notNull(),
    lineTax: money("line_tax").notNull().default("0"),
    lineTotal: money("line_total").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("order_items_quantity_positive", sql`${t.quantity} > 0`), index("order_items_order_idx").on(t.orderId)],
);

/* -------------------------------------------------------------------------- */
/* Payments                                                                    */
/* -------------------------------------------------------------------------- */

export const payments = pgTable(
  "payments",
  {
    id: id(),
    provider: paymentProviderEnum("provider").notNull(),
    purpose: paymentPurposeEnum("purpose").notNull(),
    providerOrderId: varchar("provider_order_id", { length: 120 }),
    providerPaymentId: varchar("provider_payment_id", { length: 120 }).unique(),
    amount: money("amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    status: paymentStatusEnum("status").notNull().default("PENDING"),
    method: varchar("method", { length: 40 }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    membershipId: uuid("membership_id").references(() => memberships.id, { onDelete: "set null" }),
    customerEmail: varchar("customer_email", { length: 255 }),
    idempotencyKey: varchar("idempotency_key", { length: 80 }).unique(),
    failureCode: varchar("failure_code", { length: 80 }),
    failureReason: text("failure_reason"),
    /** Sanitised gateway summary only. Never store card data or secrets here. */
    gatewaySummary: jsonb("gateway_summary"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    check("payments_amount_nonnegative", sql`${t.amount} >= 0`),
    uniqueIndex("payments_provider_order_unique").on(t.provider, t.providerOrderId),
    index("payments_booking_idx").on(t.bookingId),
    index("payments_order_idx").on(t.orderId),
  ],
);

export const refunds = pgTable(
  "refunds",
  {
    id: id(),
    paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "restrict" }),
    amount: money("amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    reason: text("reason"),
    status: refundStatusEnum("status").notNull().default("PENDING"),
    providerRefundId: varchar("provider_refund_id", { length: 120 }).unique(),
    requestedByUserId: uuid("requested_by_user_id").references(() => users.id, { onDelete: "set null" }),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    ...timestamps(),
  },
  (t) => [check("refunds_amount_positive", sql`${t.amount} > 0`), index("refunds_payment_idx").on(t.paymentId)],
);

/** Idempotency ledger for inbound gateway webhooks. */
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: id(),
    provider: paymentProviderEnum("provider").notNull(),
    eventId: varchar("event_id", { length: 120 }).notNull(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    signatureValid: boolean("signature_valid").notNull().default(false),
    status: varchar("status", { length: 20 }).notNull().default("RECEIVED"),
    payload: jsonb("payload"),
    errorMessage: text("error_message"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("webhook_events_provider_event_unique").on(t.provider, t.eventId)],
);

/* -------------------------------------------------------------------------- */
/* CMS & content                                                               */
/* -------------------------------------------------------------------------- */

export const blogCategories = pgTable("blog_categories", {
  id: id(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  ...timestamps(),
});

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: id(),
    slug: varchar("slug", { length: 180 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    excerpt: varchar("excerpt", { length: 400 }),
    content: text("content").notNull().default(""),
    featuredImageUrl: text("featured_image_url"),
    categoryId: uuid("category_id").references(() => blogCategories.id, { onDelete: "set null" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    status: publishStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    canonicalUrl: text("canonical_url"),
    ogImageUrl: text("og_image_url"),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [index("blog_posts_status_published_idx").on(t.status, t.publishedAt)],
);

export const pages = pgTable(
  "pages",
  {
    id: id(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    status: publishStatusEnum("status").notNull().default("DRAFT"),
    /** Structured, typed content blocks (hero, cards, FAQ, ...). Validated by the CMS module. */
    blocks: jsonb("blocks").$type<Array<Record<string, unknown>>>().notNull().default([]),
    seoTitle: varchar("seo_title", { length: 180 }),
    seoDescription: varchar("seo_description", { length: 320 }),
    canonicalUrl: text("canonical_url"),
    ogImageUrl: text("og_image_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps(),
    ...softDelete(),
  },
);

export const menus = pgTable("menus", {
  id: id(),
  key: varchar("key", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  ...timestamps(),
});

export const menuItems = pgTable(
  "menu_items",
  {
    id: id(),
    menuId: uuid("menu_id").notNull().references(() => menus.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => menuItems.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 80 }).notNull(),
    url: varchar("url", { length: 500 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    openInNewTab: boolean("open_in_new_tab").notNull().default(false),
    ...timestamps(),
  },
  (t) => [index("menu_items_menu_sort_idx").on(t.menuId, t.sortOrder)],
);

export const testimonials = pgTable("testimonials", {
  id: id(),
  authorName: varchar("author_name", { length: 120 }).notNull(),
  authorLocation: varchar("author_location", { length: 120 }),
  avatarUrl: text("avatar_url"),
  rating: smallint("rating").notNull().default(5),
  body: text("body").notNull(),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
  status: publishStatusEnum("status").notNull().default("DRAFT"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps(),
  ...softDelete(),
});

export const faqs = pgTable("faqs", {
  id: id(),
  question: varchar("question", { length: 300 }).notNull(),
  answer: text("answer").notNull(),
  category: varchar("category", { length: 80 }).notNull().default("General"),
  sortOrder: integer("sort_order").notNull().default(0),
  status: publishStatusEnum("status").notNull().default("DRAFT"),
  ...timestamps(),
});

export const galleryImages = pgTable("gallery_images", {
  id: id(),
  title: varchar("title", { length: 150 }).notNull(),
  imageUrl: text("image_url").notNull(),
  altText: varchar("alt_text", { length: 255 }),
  category: varchar("category", { length: 80 }).notNull().default("Spa"),
  sortOrder: integer("sort_order").notNull().default(0),
  status: publishStatusEnum("status").notNull().default("DRAFT"),
  ...timestamps(),
});

export const banners = pgTable("banners", {
  id: id(),
  title: varchar("title", { length: 150 }).notNull(),
  subtitle: varchar("subtitle", { length: 300 }),
  imageUrl: text("image_url"),
  ctaLabel: varchar("cta_label", { length: 60 }),
  ctaUrl: varchar("cta_url", { length: 500 }),
  placement: varchar("placement", { length: 60 }).notNull().default("HOME_HERO"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  status: publishStatusEnum("status").notNull().default("DRAFT"),
  ...timestamps(),
});

/* -------------------------------------------------------------------------- */
/* Engagement                                                                  */
/* -------------------------------------------------------------------------- */

export const reviews = pgTable(
  "reviews",
  {
    id: id(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
    rating: smallint("rating").notNull(),
    title: varchar("title", { length: 150 }),
    body: text("body").notNull(),
    status: reviewStatusEnum("status").notNull().default("PENDING"),
    isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
    moderatedByUserId: uuid("moderated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
    check("reviews_single_target", sql`(${t.serviceId} is null) <> (${t.productId} is null)`),
    index("reviews_service_idx").on(t.serviceId),
    index("reviews_product_idx").on(t.productId),
  ],
);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: id(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  status: subscriberStatusEnum("status").notNull().default("SUBSCRIBED"),
  source: varchar("source", { length: 60 }).notNull().default("website"),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  ...timestamps(),
});

export const contactMessages = pgTable("contact_messages", {
  id: id(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  status: messageStatusEnum("status").notNull().default("NEW"),
  handledByUserId: uuid("handled_by_user_id").references(() => users.id, { onDelete: "set null" }),
  ipHash: varchar("ip_hash", { length: 64 }),
  ...timestamps(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull().default("IN_APP"),
    type: varchar("type", { length: 80 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    data: jsonb("data"),
    recipient: varchar("recipient", { length: 255 }),
    status: notificationStatusEnum("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_read_idx").on(t.userId, t.readAt), index("notifications_status_idx").on(t.status)],
);

export const loyaltyTransactions = pgTable(
  "loyalty_transactions",
  {
    id: id(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    points: integer("points").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    reason: varchar("reason", { length: 120 }).notNull(),
    referenceType: varchar("reference_type", { length: 40 }),
    referenceId: varchar("reference_id", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("loyalty_user_created_idx").on(t.userId, t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* System                                                                      */
/* -------------------------------------------------------------------------- */

/** Key/value settings. Secrets (gateway keys, SMTP passwords) are NEVER stored here. */
export const settings = pgTable("settings", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: jsonb("value").notNull(),
  group: varchar("group", { length: 60 }).notNull().default("site"),
  isPublic: boolean("is_public").notNull().default(false),
  description: text("description"),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    actorRole: varchar("actor_role", { length: 40 }),
    action: varchar("action", { length: 120 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }),
    before: jsonb("before"),
    after: jsonb("after"),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_actor_idx").on(t.actorUserId),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);
