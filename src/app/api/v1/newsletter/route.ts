import { apiHandler, getClientIp, httpErrors, parseJsonBody, successResponse } from "@/server/http";
import { consumeRateLimit } from "@/server/rate-limit";
import { subscribeToNewsletter, type SubscribeOutcome } from "@/server/newsletter.service";
import { newsletterSubscribeSchema } from "@/shared/validators";

export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 5;

const OUTCOME_MESSAGES: Record<SubscribeOutcome, string> = {
  subscribed: "Thank you. Your seasonal rituals journal is on its way.",
  resubscribed: "Welcome back. You are subscribed again.",
  already_subscribed: "You are already on our list. Thank you for being here.",
};

/** POST /api/v1/newsletter - body: { "email": "name@example.com" } */
export const POST = apiHandler(async (request) => {
  const limit = consumeRateLimit(`newsletter:${getClientIp(request)}`, {
    limit: MAX_ATTEMPTS_PER_WINDOW,
    windowMs: WINDOW_MS,
  });
  if (!limit.allowed) {
    throw httpErrors.tooManyRequests("Too many attempts. Please try again in a few minutes.", limit.retryAfterSeconds);
  }

  const input = await parseJsonBody(request, newsletterSubscribeSchema);
  const outcome = await subscribeToNewsletter(input.email);

  return successResponse({ status: outcome }, OUTCOME_MESSAGES[outcome], outcome === "subscribed" ? 201 : 200);
});
