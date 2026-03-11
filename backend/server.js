require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");
const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middleware/authMiddleware");

const app = express();
const prisma = new PrismaClient();

// ─── Seguridad ────────────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS: permitir cookies cross-origin del frontend ─────────────────────────
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// ─── Parsers ──────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);

// protect → verifica JWT antes de procesar la compra
app.post("/compras", protect, async (req, res, next) => {
  try {
    const { usuario, total } = req.body;
    const nuevaCompra = await prisma.compra.create({
      data: { usuario, total }
    });
    res.json(nuevaCompra);
  } catch (error) {
    next(error);
  }
});

// ─── Error handler centralizado ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);

  if (err.code === "P2002") {
    return res.status(409).json({ error: "El registro ya existe (duplicado)" });
  }

  res.status(500).json({ error: "Error interno del servidor" });
});

// ─── Servidor ─────────────────────────────────────────────────────────────────
app.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});