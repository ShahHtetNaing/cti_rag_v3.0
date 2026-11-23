export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ detail: "Method not allowed." });
  }

  const baseUrl = process.env.CTI_GATEWAY_URL;
  const gatewayKey = process.env.CTI_GATEWAY_KEY;
  if (!baseUrl || !gatewayKey) {
    return res.status(500).json({ detail: "Gateway environment variables are missing." });
  }

  let payload = req.body ?? {};
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ detail: "Invalid JSON request body." });
    }
  }

  if (!payload || typeof payload.question !== "string" || !payload.question.trim()) {
    return res.status(400).json({ detail: "Question is required." });
  }

  const forwardBody = {
    question: payload.question,
    mode: payload.mode === "email" ? "email" : "cti",
    use_live_api: Boolean(payload.use_live_api),
    ...(payload.session_id ? { session_id: String(payload.session_id) } : {}),
    ...(payload.previous_question ? { previous_question: String(payload.previous_question) } : {}),
    ...(payload.previous_answer ? { previous_answer: String(payload.previous_answer) } : {}),
  };

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/query`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Gateway-Key": gatewayKey,
      },
      body: JSON.stringify(forwardBody),
      signal: AbortSignal.timeout(55000),
    });

    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.send(body);
  } catch (error) {
    console.error("CTI query proxy error:", error);
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      return res.status(504).json({ detail: "CTI gateway timed out before completing generation." });
    }
    return res.status(502).json({ detail: "Unable to reach the CTI gateway." });
  }
}
