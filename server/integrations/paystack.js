import { createHmac, timingSafeEqual } from "node:crypto";

export function validSignature(body, signature, secret) {
  if (!secret || !/^[a-f0-9]{128}$/i.test(signature || "")) return false;
  const expected = createHmac("sha512", secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

export function createPaystack(config, request = fetch) {
  async function api(path, body) {
    const response = await request(`https://api.paystack.co${path}`, {
      method: body ? "POST" : "GET",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: `Bearer ${config.paystackKey}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    if (!response.ok || !result.status)
      throw new Error("Payment provider request failed");
    return result.data;
  }
  return {
    async checkout(user, reference) {
      const plan = await api(
        `/plan/${encodeURIComponent(config.paystackPlan)}`,
      );
      if (
        plan.currency !== "ZAR" ||
        plan.amount !== config.proPrice ||
        plan.interval !== "monthly"
      )
        throw new Error(
          "Payment plan does not match configured ZAR monthly pricing",
        );
      const result = await api("/transaction/initialize", {
        email: user.email,
        amount: config.proPrice,
        currency: "ZAR",
        plan: config.paystackPlan,
        reference,
        callback_url: `${config.origin}/app/billing`,
        metadata: { user_id: user.id },
      });
      const url = new URL(result.authorization_url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.paystack.com")
        throw new Error("Unexpected checkout destination");
      return result;
    },
    verify: (reference) =>
      api(`/transaction/verify/${encodeURIComponent(reference)}`),
    subscription: (code) => api(`/subscription/${encodeURIComponent(code)}`),
    cancel: (code, email_token) =>
      api("/subscription/disable", { code, token: email_token }),
  };
}

export function checkedCharge(data, config, reference) {
  const plan =
    data.plan_object?.plan_code ||
    data.plan?.plan_code ||
    (typeof data.plan === "string" ? data.plan : null);
  if (
    data.reference !== reference ||
    data.status !== "success" ||
    data.currency !== "ZAR" ||
    data.amount !== config.proPrice ||
    plan !== config.paystackPlan ||
    !data.customer?.customer_code
  )
    throw new Error("Unverified subscription charge");
  const paid = Date.parse(data.paid_at);
  if (
    !Number.isFinite(paid) ||
    paid > Date.now() + 300000 ||
    paid < Date.now() - 45 * 86400000
  )
    throw new Error("Stale or invalid subscription charge");
  const expires = new Date(paid);
  expires.setUTCMonth(expires.getUTCMonth() + 1);
  return { customer: data.customer.customer_code, expires: expires.getTime() };
}
