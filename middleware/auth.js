const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const header = req.headers["authorization"];
  const token = header && header.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token tidak ditemukan" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token tidak valid" });
    }

    req.user = decoded.user; 
    next();
  });
}

function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      return res
        .status(403)
        .json({ error: "Akses Dilarang: Peran tidak memadai" });
    }
  };
}

module.exports = { authenticateToken, authorizeRole };
