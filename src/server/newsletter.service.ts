import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

export type SubscribeOutcome = "subscribed" | "resubscribed" | "already_subscribed";

/**
 * Idempotent subscription: repeated submissions never create duplicate rows and never
 * reveal more than the outcome. The unique index on email is the final safeguard.
 */
export async function subscribeToNewsletter(email: string, source = "website"): Promise<SubscribeOutcome> {
  const [existing] = await db
    .select({ id: newsletterSubscribers.id, status: newsletterSubscribers.status })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (existing) {
    if (existing.status === "SUBSCRIBED") {
      return "already_subscribed";
    }
    await db
      .update(newsletterSubscribers)
      .set({ status: "SUBSCRIBED", unsubscribedAt: null, subscribedAt: new Date() })
      .where(eq(newsletterSubscribers.id, existing.id));
    return "resubscribed";
  }

  const inserted = await db
    .insert(newsletterSubscribers)
    .values({ email, source })
    .onConflictDoNothing({ target: newsletterSubscribers.email })
    .returning({ id: newsletterSubscribers.id });

  return inserted.length > 0 ? "subscribed" : "already_subscribed";
}

export async function removeNewsletterSubscriber(email: string): Promise<void> {
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, email));
}
