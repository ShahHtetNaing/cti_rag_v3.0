
export default async function handler(req, res) {
  const baseUrl = process.env.CTI_GATEWAY_URL;
  const gatewayKey = process.env.CTI_GATEWAY_KEY;

  if (!baseUrl || !gatewayKey) {
    return res.status(500).json({
      detail: "Gateway environment variables are missing."
    });
  }

  const path = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : req.query.path || "";

  if (!["health", "query"].includes(path)) {
    return res.status(404).json({
      detail: "Endpoint not found."
    });
  }

  const method = req.method;

  if (
    (path === "health" && method !== "GET") ||
    (path === "query" && method !== "POST")
  ) {
    res.setHeader("Allow", path === "health" ? "GET" : "POST");
    return res.status(405).json({
      detail: "Method not allowed."
    });
  }

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/api/${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Gateway-Key": gatewayKey
        },
        body: method === "POST"
          ? JSON.stringify(req.body)
          : undefined
      }
    );

    const data = await response.text();

    res.status(response.status);
    res.setHeader("Content-Type", "application/json");
    return res.send(data);

  } catch (error) {
    console.error("CTI gateway error:", error);

    return res.status(502).json({
      detail: "Unable to reach the CTI gateway."
    });
  }
}