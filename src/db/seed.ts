import "dotenv/config";

import { eq } from "drizzle-orm";
import { SITE_DEFAULTS, SITE_SETTING_KEYS } from "../shared/site";
import { db, pool } from "./index";
import {
  branches,
  menuItems,
  menus,
  permissions,
  rolePermissions,
  roles,
  serviceBranches,
  serviceCategories,
  services,
  settings,
} from "./schema";

/**
 * Idempotent demo seed. Re-running it never overwrites admin edits (inserts use
 * "do nothing" conflict handling). Demo user accounts are added in Phase 2 together
 * with password hashing; no credentials are created here.
 */

const PERMISSIONS: Array<{ code: string; module: string; description: string }> = [
  { code: "dashboard:view", module: "dashboard", description: "View the admin dashboard" },
  { code: "bookings:read", module: "bookings", description: "View bookings in scope" },
  { code: "bookings:manage", module: "bookings", description: "Create, reschedule and update bookings" },
  { code: "services:manage", module: "services", description: "Manage services and categories" },
  { code: "staff:manage", module: "staff", description: "Manage staff, schedules and time off" },
  { code: "branches:manage", module: "branches", description: "Manage branches and holidays" },
  { code: "customers:manage", module: "customers", description: "Manage customer accounts" },
  { code: "memberships:manage", module: "memberships", description: "Manage plans and memberships" },
  { code: "products:manage", module: "ecommerce", description: "Manage products, categories and coupons" },
  { code: "orders:manage", module: "ecommerce", description: "Process orders and inventory" },
  { code: "payments:manage", module: "payments", description: "Manage payment gateways and refunds" },
  { code: "cms:manage", module: "cms", description: "Manage pages, blog and content" },
  { code: "reports:view", module: "reports", description: "View analytics and reports" },
  { code: "settings:manage", module: "settings", description: "Manage site and system settings" },
  { code: "roles:manage", module: "rbac", description: "Manage admins and role assignments" },
  { code: "audit:read", module: "audit", description: "Read audit logs" },
  { code: "account:self", module: "account", description: "Manage own profile and addresses" },
  { code: "bookings:self", module: "account", description: "View and manage own bookings" },
  { code: "orders:self", module: "account", description: "View own orders" },
  { code: "memberships:self", module: "account", description: "View and purchase own memberships" },
];

const ROLE_DEFINITIONS: Array<{ code: string; name: string; description: string; permissions: string[] | "ALL" }> = [
  {
    code: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Full platform access, including payment settings and role management.",
    permissions: "ALL",
  },
  {
    code: "ADMIN",
    name: "Administrator",
    description: "Runs day-to-day business operations across all branches.",
    permissions: [
      "dashboard:view", "bookings:read", "bookings:manage", "services:manage", "staff:manage",
      "branches:manage", "customers:manage", "memberships:manage", "products:manage", "orders:manage",
      "cms:manage", "reports:view", "audit:read", "account:self", "bookings:self", "orders:self",
      "memberships:self",
    ],
  },
  {
    code: "BRANCH_MANAGER",
    name: "Branch Manager",
    description: "Manages bookings, schedules and staff for assigned branches only.",
    permissions: [
      "dashboard:view", "bookings:read", "bookings:manage", "staff:manage", "reports:view", "account:self",
    ],
  },
  {
    code: "STAFF",
    name: "Therapist & Staff",
    description: "Views assigned appointments and manages personal availability.",
    permissions: ["bookings:read", "account:self"],
  },
  {
    code: "CUSTOMER",
    name: "Customer",
    description: "Books appointments, shops and manages personal account data.",
    permissions: ["account:self", "bookings:self", "orders:self", "memberships:self"],
  },
];

const WEEKDAY_HOURS = { open: "09:00", close: "21:30", closed: false };
const SUNDAY_HOURS = { open: "10:00", close: "20:00", closed: false };
const OPENING_HOURS = {
  mon: WEEKDAY_HOURS,
  tue: WEEKDAY_HOURS,
  wed: WEEKDAY_HOURS,
  thu: WEEKDAY_HOURS,
  fri: WEEKDAY_HOURS,
  sat: WEEKDAY_HOURS,
  sun: SUNDAY_HOURS,
};

const BRANCHES = [
  {
    slug: "bandra-mumbai",
    name: "GenSpa Bandra",
    email: "bandra@genspa.in",
    phone: "+912260000100",
    addressLine1: "Hill Road, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400050",
    latitude: "19.059600",
    longitude: "72.829500",
    description: "Our flagship sanctuary on Hill Road with quiet, private suites.",
  },
  {
    slug: "indiranagar-bengaluru",
    name: "GenSpa Indiranagar",
    email: "indiranagar@genspa.in",
    phone: "+918060000200",
    addressLine1: "100 Feet Road, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    latitude: "12.971900",
    longitude: "77.641200",
    description: "A garden-facing studio designed for slow weekend rituals.",
  },
  {
    slug: "khan-market-delhi",
    name: "GenSpa Khan Market",
    email: "khanmarket@genspa.in",
    phone: "+911160000300",
    addressLine1: "Middle Lane, Khan Market",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110003",
    latitude: "28.600000",
    longitude: "77.227300",
    description: "A city-centre retreat with Ayurvedic therapy rooms.",
  },
];

const CATEGORIES = [
  { slug: "massage-therapies", name: "Massage Therapies", description: "Hands-on therapies for release and deep relaxation.", sortOrder: 1 },
  { slug: "ayurveda-rituals", name: "Ayurveda Rituals", description: "Traditional Indian rituals with herbal oils and warm therapy.", sortOrder: 2 },
  { slug: "facial-skin-care", name: "Facial & Skin Care", description: "Targeted facials that restore clarity and glow.", sortOrder: 3 },
  { slug: "body-and-nail-care", name: "Body & Nail Care", description: "Refined grooming rituals for hands, feet and head.", sortOrder: 4 },
];

interface ServiceSeed {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  duration: number;
  price: string;
  discountPrice?: string;
  buffer: number;
  featured: boolean;
  image: number;
}

const SERVICES: ServiceSeed[] = [
  {
    slug: "signature-balinese-massage",
    name: "Signature Balinese Massage",
    category: "massage-therapies",
    shortDescription: "Rhythmic long strokes and acupressure to melt everyday tension.",
    description: "Our signature full-body massage blends long flowing strokes, gentle kneading and acupressure with a warm botanical oil chosen for your skin.",
    duration: 60, price: "3500.00", buffer: 10, featured: true, image: 1,
  },
  {
    slug: "deep-tissue-restore",
    name: "Deep Tissue Restore",
    category: "massage-therapies",
    shortDescription: "Firm, targeted pressure for chronic knots and muscle fatigue.",
    description: "A therapeutic session focused on deeper muscle layers. Your therapist works slowly through problem areas, with pressure adjusted at every stage.",
    duration: 90, price: "4800.00", discountPrice: "4200.00", buffer: 10, featured: false, image: 2,
  },
  {
    slug: "aromatherapy-serenity-ritual",
    name: "Aromatherapy Serenity Ritual",
    category: "massage-therapies",
    shortDescription: "A calming full-body massage with essential oils tailored to your mood.",
    description: "Select an aroma profile during your consultation. Lavender, bergamot or sandalwood guides a slow, meditative massage with a scalp finish.",
    duration: 75, price: "4200.00", buffer: 10, featured: true, image: 3,
  },
  {
    slug: "hot-stone-renewal",
    name: "Hot Stone Renewal",
    category: "massage-therapies",
    shortDescription: "Warmed basalt stones ease stiffness and restore circulation.",
    description: "Smooth basalt stones, warmed to a comfortable temperature, glide across the body to loosen muscles and calm the nervous system.",
    duration: 90, price: "5200.00", discountPrice: "4900.00", buffer: 10, featured: true, image: 4,
  },
  {
    slug: "ayurvedic-abhyanga",
    name: "Ayurvedic Abhyanga",
    category: "ayurveda-rituals",
    shortDescription: "A traditional warm-oil massage that nourishes skin and balances energy.",
    description: "An Ayurvedic self-care ritual performed with warm sesame oil in long, rhythmic strokes, followed by a steam cabinet cleanse.",
    duration: 60, price: "3200.00", buffer: 10, featured: false, image: 5,
  },
  {
    slug: "shirodhara-ritual",
    name: "Shirodhara Ritual",
    category: "ayurveda-rituals",
    shortDescription: "A slow stream of warm herbal oil over the forehead for deep mental rest.",
    description: "One of Ayurveda's most restorative therapies. A continuous stream of warm, herb-infused oil on the third eye calms the mind and eases sleep.",
    duration: 60, price: "4000.00", discountPrice: "3600.00", buffer: 10, featured: true, image: 6,
  },
  {
    slug: "signature-glow-facial",
    name: "Signature Glow Facial",
    category: "facial-skin-care",
    shortDescription: "Cleanse, exfoliate and hydrate for an immediate radiant finish.",
    description: "A complete facial customised to your skin type, including cleansing, gentle exfoliation, a massage and a hydrating mask.",
    duration: 60, price: "3600.00", buffer: 10, featured: true, image: 7,
  },
  {
    slug: "vitamin-c-radiance-facial",
    name: "Vitamin C Radiance Facial",
    category: "facial-skin-care",
    shortDescription: "Brightening treatment for dull, uneven-looking skin.",
    description: "A vitamin C infused facial that brightens tone and smooths texture, finished with a cooling serum and SPF recommendation.",
    duration: 75, price: "4500.00", discountPrice: "3999.00", buffer: 10, featured: false, image: 8,
  },
  {
    slug: "couples-retreat-journey",
    name: "Couples Retreat Journey",
    category: "massage-therapies",
    shortDescription: "Side-by-side massage suites with a shared herbal tea ritual.",
    description: "Two synchronised massages in a private suite, followed by herbal tea and a quiet lounge moment. Ideal for anniversaries and slow weekends.",
    duration: 120, price: "11000.00", discountPrice: "9500.00", buffer: 15, featured: true, image: 9,
  },
  {
    slug: "prenatal-comfort-massage",
    name: "Prenatal Comfort Massage",
    category: "massage-therapies",
    shortDescription: "Gentle, pregnancy-safe massage for comfort in every trimester.",
    description: "Delivered by therapists trained in prenatal care. Positioning is adapted for comfort and the session focuses on back, hips and legs.",
    duration: 60, price: "3800.00", buffer: 10, featured: false, image: 10,
  },
  {
    slug: "manicure-pedicure-spa",
    name: "Manicure & Pedicure Spa",
    category: "body-and-nail-care",
    shortDescription: "Soak, scrub, shape and polish with a relaxing hand and foot massage.",
    description: "A complete hand and foot ritual with a warm soak, exfoliating scrub, nail shaping, cuticle care and polish of your choice.",
    duration: 60, price: "2200.00", buffer: 5, featured: false, image: 4,
  },
  {
    slug: "head-and-neck-revival",
    name: "Head & Neck Revival",
    category: "body-and-nail-care",
    shortDescription: "A thirty-minute express treatment for tired shoulders and a clear mind.",
    description: "A focused scalp, head and neck massage. The perfect midday reset between meetings.",
    duration: 30, price: "1500.00", buffer: 5, featured: false, image: 5,
  },
];

const MENUS = [
  {
    key: "main-nav",
    name: "Main navigation",
    description: "Primary navigation in the public header.",
    items: [
      { label: "Services", url: "#services" },
      { label: "About", url: "#about" },
      { label: "Why GenSpa", url: "#why-genspa" },
      { label: "How it works", url: "#how-it-works" },
      { label: "Contact", url: "#contact" },
    ],
  },
  {
    key: "footer-explore",
    name: "Footer explore links",
    description: "Quick links in the site footer.",
    items: [
      { label: "Services", url: "#services" },
      { label: "About", url: "#about" },
      { label: "How it works", url: "#how-it-works" },
      { label: "Contact", url: "#contact" },
    ],
  },
];

async function seedRbac() {
  await db
    .insert(permissions)
    .values(PERMISSIONS)
    .onConflictDoNothing({ target: permissions.code });

  const allPermissions = await db.select({ id: permissions.id, code: permissions.code }).from(permissions);

  for (const definition of ROLE_DEFINITIONS) {
    const [role] = await db
      .insert(roles)
      .values({ code: definition.code, name: definition.name, description: definition.description, isSystem: true })
      .onConflictDoUpdate({
        target: roles.code,
        set: { name: definition.name, description: definition.description },
      })
      .returning({ id: roles.id });

    if (!role) {
      continue;
    }

    const granted =
      definition.permissions === "ALL"
        ? allPermissions.map((permission) => permission.id)
        : allPermissions
            .filter((permission) => (definition.permissions as string[]).includes(permission.code))
            .map((permission) => permission.id);

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
    if (granted.length > 0) {
      await db
        .insert(rolePermissions)
        .values(granted.map((permissionId) => ({ roleId: role.id, permissionId })))
        .onConflictDoNothing();
    }
  }
}

async function seedSettings() {
  for (const key of SITE_SETTING_KEYS) {
    await db
      .insert(settings)
      .values({
        key: `site.${key}`,
        value: SITE_DEFAULTS[key],
        group: "site",
        isPublic: true,
        description: `Public website content: ${key}`,
      })
      .onConflictDoNothing({ target: settings.key });
  }
}

async function seedCatalogue() {
  await db.insert(branches).values(
    BRANCHES.map((branch) => ({ ...branch, openingHours: OPENING_HOURS, status: "ACTIVE" as const })),
  ).onConflictDoNothing({ target: branches.slug });

  await db
    .insert(serviceCategories)
    .values(CATEGORIES.map((category) => ({ ...category, status: "ACTIVE" as const })))
    .onConflictDoNothing({ target: serviceCategories.slug });

  const categoryRows = await db.select({ id: serviceCategories.id, slug: serviceCategories.slug }).from(serviceCategories);
  const categoryIdBySlug = new Map(categoryRows.map((row) => [row.slug, row.id]));

  for (const service of SERVICES) {
    const imageUrl = `/images/services/service-${String(service.image).padStart(2, "0")}.jpg`;
    await db
      .insert(services)
      .values({
        slug: service.slug,
        name: service.name,
        categoryId: categoryIdBySlug.get(service.category),
        shortDescription: service.shortDescription,
        description: service.description,
        featuredImageUrl: imageUrl,
        durationMinutes: service.duration,
        price: service.price,
        discountPrice: service.discountPrice ?? null,
        bufferMinutes: service.buffer,
        isFeatured: service.featured,
        status: "ACTIVE",
        seoTitle: `${service.name} | GenSpa`,
        seoDescription: service.shortDescription,
      })
      .onConflictDoNothing({ target: services.slug });
  }

  const branchRows = await db.select({ id: branches.id }).from(branches);
  const serviceRows = await db.select({ id: services.id }).from(services);
  const links = serviceRows.flatMap((service) =>
    branchRows.map((branch) => ({ serviceId: service.id, branchId: branch.id, isActive: true })),
  );
  if (links.length > 0) {
    await db.insert(serviceBranches).values(links).onConflictDoNothing();
  }
}

async function seedMenus() {
  for (const menu of MENUS) {
    const [row] = await db
      .insert(menus)
      .values({ key: menu.key, name: menu.name, description: menu.description })
      .onConflictDoUpdate({ target: menus.key, set: { name: menu.name, description: menu.description } })
      .returning({ id: menus.id });

    if (!row) {
      continue;
    }

    await db.delete(menuItems).where(eq(menuItems.menuId, row.id));
    await db.insert(menuItems).values(
      menu.items.map((item, index) => ({
        menuId: row.id,
        label: item.label,
        url: item.url,
        sortOrder: (index + 1) * 10,
        isActive: true,
        openInNewTab: false,
      })),
    );
  }
}

async function main() {
  console.log("Seeding GenSpa demo data (idempotent)...");
  await seedRbac();
  await seedSettings();
  await seedCatalogue();
  await seedMenus();
  console.log(
    `Done: ${PERMISSIONS.length} permissions, ${ROLE_DEFINITIONS.length} roles, ${BRANCHES.length} branches, ${CATEGORIES.length} categories, ${SERVICES.length} services, ${MENUS.length} menus.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
