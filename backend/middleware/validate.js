function requireFields(fields) {
  return (req, res, next) => {
    const body = req.body || {};
    const missing = fields.filter((f) => {
      const val = body[f];
      return val === undefined || val === null || String(val).trim() === "";
    });
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required field(s): ${missing.join(", ")}`
      });
    }
    return next();
  };
}

function sanitizeString(value, maxLen = 120) {
  return String(value || "").trim().slice(0, maxLen);
}

module.exports = { requireFields, sanitizeString };
