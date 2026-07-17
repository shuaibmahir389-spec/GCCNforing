export default async function handler(req, res) {
  // Allow CORS for local testing
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { key } = req.query;
  const CLOUD_URLS = {
    pdfs: "https://extendsclass.com/api/json-storage/bin/acbabfb",
    routine: "https://extendsclass.com/api/json-storage/bin/eabbdff",
    notices: "https://extendsclass.com/api/json-storage/bin/dffaaee"
  };

  if (!CLOUD_URLS[key]) {
    return res.status(400).json({ error: "Invalid key" });
  }

  if (req.method === "GET") {
    try {
      const response = await fetch(CLOUD_URLS[key]);
      if (!response.ok) {
        throw new Error(`Failed to fetch from cloud: ${response.status}`);
      }
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST" || req.method === "PUT") {
    try {
      const response = await fetch(CLOUD_URLS[key], {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) {
        throw new Error(`Failed to save to cloud: ${response.status}`);
      }
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
