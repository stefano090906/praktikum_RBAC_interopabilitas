require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./database.js");
const { authenticateToken, authorizeRole } = require("./middleware/auth.js");

const app = express();
const PORT = process.env.PORT || 3200;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// STATUS
app.get("/status", (req, res) => {
  res.json({
    ok: true,
    service: "Movie API + RBAC",
  });
});

// REGISTER USER (role = user)
app.post("/auth/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 6)
    return res.status(400).json({ error: "Invalid username or password" });

  bcrypt.hash(password, 10, (err, hashed) => {
    if (err) return res.status(500).json({ error: "Hash gagal" });

    const sql = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
    const params = [username.toLowerCase(), hashed, "user"];

    db.run(sql, params, function (err) {
      if (err) {
        if (err.message.includes("UNIQUE"))
          return res.status(409).json({ error: "Username sudah ada" });

        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: "Registrasi berhasil",
        userId: this.lastID,
      });
    });
  });
});

// REGISTER ADMIN (khusus pengembangan)
app.post("/auth/register-admin", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 6)
    return res.status(400).json({ error: "Invalid username or password" });

  bcrypt.hash(password, 10, (err, hashed) => {
    if (err) return res.status(500).json({ error: "Hash gagal" });

    const sql = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;
    const params = [username.toLowerCase(), hashed, "admin"];

    db.run(sql, params, function (err) {
      if (err) {
        if (err.message.includes("UNIQUE"))
          return res
            .status(409)
            .json({ error: "Username admin sudah ada" });

        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: "Admin berhasil dibuat",
        userId: this.lastID,
      });
    });
  });
});

// LOGIN (token menyertakan role)
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;

  const sql = `SELECT * FROM users WHERE username = ?`;
  db.get(sql, [username.toLowerCase()], (err, user) => {
    if (err || !user)
      return res.status(401).json({ error: "Username/password salah" });

    bcrypt.compare(password, user.password, (err, match) => {
      if (!match) return res.status(401).json({ error: "Password salah" });

      const payload = {
        user: {
          id: user.id,
          username: user.username,
          role: user.role, // <== penting
        },
      };

      jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
        if (err) return res.status(500).json({ error: "Token gagal dibuat" });

        res.json({
          message: "Login berhasil",
          token,
        });
      });
    });
  });
});

// MOVIES ROUTES
// GET — publik
app.get("/movies", (req, res) => {
  db.all("SELECT * FROM movies", [], (err, rows) => {
    res.json({ data: rows });
  });
});

// POST — hanya user login
app.post("/movies", authenticateToken, (req, res) => {
  const { title, director, year } = req.body;

  db.run(
    "INSERT INTO movies (title, director, year) VALUES (?, ?, ?)",
    [title, director, year],
    function (err) {
      res.json({ message: "Movie added", id: this.lastID });
    }
  );
});

// PUT — hanya admin
app.put(
  "/movies/:id",
  [authenticateToken, authorizeRole("admin")],
  (req, res) => {
    res.json({ message: "Admin boleh edit movie" });
  }
);

// DELETE — hanya admin
app.delete(
  "/movies/:id",
  [authenticateToken, authorizeRole("admin")],
  (req, res) => {
    res.json({ message: "Movie deleted (admin only)" });
  }
);

// RUN SERVER
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
