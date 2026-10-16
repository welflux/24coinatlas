export function createMailer(config, request = fetch) {
  return {
    async send({ to, subject, html }) {
      const response = await request("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: {
          Authorization: `Bearer ${config.mailKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.mailFrom,
          to: [to],
          subject,
          html,
        }),
      });
      if (!response.ok) throw new Error("Mail provider request failed");
      const result = await response.json();
      if (!result.id)
        throw new Error("Mail provider did not acknowledge the message");
    },
  };
}
