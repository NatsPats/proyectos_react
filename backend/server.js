require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.post("/compras", async (req, res) => {
  try {
    const { usuario, total } = req.body;

    const nuevaCompra = await prisma.compra.create({
      data: { usuario, total }
    });

    res.json(nuevaCompra);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar compra" });
  }
});

app.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});