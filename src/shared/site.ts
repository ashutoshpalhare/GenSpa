/**
 * Public website content contract. Values are stored in the `settings` table under
 * keys `site.<group>` and merged over these defaults at read time, so a page never
 * renders empty when a setting has not been configured yet.
 */

export interface NavItem {
  label: string;
  url: string;
  openInNewTab: boolean;
}

export type FeatureIcon = "users" | "shield" | "calendar" | "card" | "sparkles" | "leaf";

export interface FeatureItem {
  title: string;
  description: string;
  icon: FeatureIcon;
}

export interface StepItem {
  title: string;
  description: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface SiteSettings {
  general: {
    brandName: string;
    tagline: string;
    defaultCity: string;
    currency: string;
    locale: string;
    timezone: string;
  };
  announcement: {
    enabled: boolean;
    text: string;
    href: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    subtitle: string;
    imageUrl: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    stats: StatItem[];
  };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    imageUrl: string;
    highlights: string[];
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    hours: string;
  };
  social: {
    instagram: string;
    facebook: string;
    youtube: string;
  };
  homepage: {
    features: FeatureItem[];
    steps: StepItem[];
    newsletterTitle: string;
    newsletterBody: string;
  };
}

export interface SiteConfig extends SiteSettings {
  navigation: {
    main: NavItem[];
    footer: NavItem[];
  };
}

export const SITE_SETTING_KEYS = [
  "general",
  "announcement",
  "hero",
  "about",
  "contact",
  "social",
  "homepage",
] as const satisfies ReadonlyArray<keyof SiteSettings>;

export const SITE_DEFAULTS: SiteSettings = {
  general: {
    brandName: "GenSpa",
    tagline: "Premium spa and wellness rituals, designed for stillness and restoration.",
    defaultCity: "Mumbai",
    currency: "INR",
    locale: "en-IN",
    timezone: "Asia/Kolkata",
  },
  announcement: {
    enabled: true,
    text: "Complimentary aromatherapy foot ritual with every Signature booking this month · Free shipping above ₹2,999",
    href: "#services",
  },
  hero: {
    eyebrow: "Premium Spa & Wellness · India",
    title: "Stillness,",
    highlight: "composed for you.",
    subtitle:
      "Signature rituals by certified therapists across Mumbai, Bengaluru and New Delhi. Book in under a minute with transparent pricing in INR.",
    imageUrl: "/images/hero.jpg",
    primaryCtaLabel: "Explore rituals",
    primaryCtaHref: "#services",
    secondaryCtaLabel: "Our philosophy",
    secondaryCtaHref: "#about",
    stats: [
      { value: "3", label: "Signature studios" },
      { value: "12", label: "Curated rituals" },
      { value: "100%", label: "Certified therapists" },
    ],
  },
  about: {
    eyebrow: "Our Philosophy",
    title: "A sanctuary built on the art of slowing down.",
    paragraphs: [
      "GenSpa blends time-tested Ayurvedic practice with modern clinical technique. Every ritual begins with a short consultation so your therapist can tailor pressure, aroma and pace to the way your body feels today.",
      "Our studios are designed as quiet, private suites. Lighting, linen and sound are chosen to help you switch off from the day and return to yourself.",
    ],
    imageUrl: "/images/about.jpg",
    highlights: [
      "Certified, continually trained therapists",
      "Ayurveda-inspired and modern clinical techniques",
      "Medical-grade sanitisation between every guest",
      "Transparent INR pricing with no hidden charges",
    ],
  },
  contact: {
    email: "hello@genspa.in",
    phone: "+91 22 6000 0100",
    address: "Hill Road, Bandra West, Mumbai 400050",
    hours: "Daily · 9:00 AM – 9:30 PM",
  },
  social: {
    instagram: "https://instagram.com/genspa.in",
    facebook: "https://facebook.com/genspa",
    youtube: "https://youtube.com/@genspa",
  },
  homepage: {
    features: [
      {
        title: "Certified therapists",
        description: "Every therapist is certified, background-verified and trained in our signature protocols.",
        icon: "users",
      },
      {
        title: "Hygiene-first studios",
        description: "Single-use linen, medical-grade sanitisation and a private suite reset between every guest.",
        icon: "shield",
      },
      {
        title: "Real-time booking",
        description: "Choose a branch, therapist and time. Slots update live and are reserved the moment you confirm.",
        icon: "calendar",
      },
      {
        title: "Clear, secure payments",
        description: "Prices in INR with applicable GST shown upfront. Payments are verified securely before confirmation.",
        icon: "card",
      },
    ],
    steps: [
      {
        title: "Choose your ritual",
        description: "Select a branch and a signature treatment that suits how you want to feel.",
      },
      {
        title: "Pick therapist & time",
        description: "See live availability for your preferred therapist, or the next free slot across the studio.",
      },
      {
        title: "Confirm & pay securely",
        description: "Apply a coupon, pay through our verified payment partner and receive instant confirmation.",
      },
      {
        title: "Arrive and unwind",
        description: "Arrive ten minutes early. Your therapist takes care of everything else.",
      },
    ],
    newsletterTitle: "Seasonal rituals, delivered quietly.",
    newsletterBody:
      "Receive private offers, new treatments and wellness notes. One thoughtful email a month. Unsubscribe at any time.",
  },
};

export interface ServiceCard {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  categoryName: string | null;
  durationMinutes: number;
  price: string;
  discountPrice: string | null;
  featuredImageUrl: string | null;
  isFeatured: boolean;
}
