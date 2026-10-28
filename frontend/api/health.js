export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    service: "gdias-api-serverless",
    time: new Date().toISOString()
  });
}
