const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // nativo de Node.js, genera tokens aleatorios seguros
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { PrismaClient } = require("@prisma/client");
const { sendEmail } = require("../config/mailer");
const { verifyEmailTemplate, resetPasswordTemplate } = require("../config/emails");

const router = express.Router();
const prisma = new PrismaClient();

// ─── Rate limiters ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Demasiados intentos de login. Intenta de nuevo en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 3,
  message: { error: "Demasiadas solicitudes de email. Espera un minuto." },
});

// ─── Helpers JWT ──────────────────────────────────────────────────────────────
const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: "7d" });

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "Strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  // secure: true  ← descomentar en producción
};

// ─── POST /auth/register ──────────────────────────────────────────────────────
// Crea el usuario, genera un token aleatorio, lo guarda en BD y envía email
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("El nombre es requerido"),
    body("email").isEmail().withMessage("Email inválido").normalizeEmail({ gmail_remove_dots: false }),
    body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(409).json({ error: "Ya existe una cuenta con ese email" });

      const passwordHash = await bcrypt.hash(password, 10);

      // Generar token de verificación: 32 bytes aleatorios → string hexadecimal de 64 chars
      // crypto.randomBytes es criptográficamente seguro (no usar Math.random para esto)
      const verifyToken = crypto.randomBytes(32).toString("hex");
      const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      await prisma.user.create({
        data: { name, email, passwordHash, verifyToken, verifyTokenExpiry },
      });

      // Construir la URL que irá en el email
      const verifyUrl = `${process.env.BACKEND_URL}/auth/verify/${verifyToken}`;
      await sendEmail(email, "Verifica tu cuenta en NebulaWear", verifyEmailTemplate(name, verifyUrl));

      res.status(201).json({ message: "Cuenta creada. Revisa tu email para verificarla." });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /auth/verify/:token ──────────────────────────────────────────────────
// El usuario hace click en el link del email → este endpoint activa la cuenta
router.get("/verify/:token", async (req, res, next) => {
  const { token } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { verifyToken: token } });

    // Si no existe el token o ya expiró
    if (!user || !user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
      // Redirigir al frontend con mensaje de error
      return res.redirect(`${process.env.FRONTEND_URL}/verify-email?status=invalid`);
    }

    // Activar la cuenta: isVerified=true, borrar el token (ya no sirve)
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null, verifyTokenExpiry: null },
    });

    res.redirect(`${process.env.FRONTEND_URL}/verify-email?status=success`);
  } catch (error) {
    next(error);
  }
});

// ─── POST /auth/resend-verification ──────────────────────────────────────────
// El usuario pide que le reenvíen el email de verificación
router.post("/resend-verification", emailLimiter, async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Respuesta genérica siempre (no revelar si el email existe o no)
    if (!user || user.isVerified) {
      return res.json({ message: "Si tu email está registrado y sin verificar, recibirás el correo." });
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExpiry },
    });

    const verifyUrl = `${process.env.BACKEND_URL}/auth/verify/${verifyToken}`;
    await sendEmail(email, "Verifica tu cuenta en NebulaWear", verifyEmailTemplate(user.name, verifyUrl));

    res.json({ message: "Si tu email está registrado y sin verificar, recibirás el correo." });
  } catch (error) {
    next(error);
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().withMessage("Email inválido").normalizeEmail({ gmail_remove_dots: false }),
    body("password").notEmpty().withMessage("La contraseña es requerida"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
      }

      // Bloquear login si el email no está verificado
      if (!user.isVerified) {
        return res.status(403).json({
          error: "Debes verificar tu email antes de iniciar sesión.",
          code: "EMAIL_NOT_VERIFIED", // el frontend usará este código para mostrar la opción de reenviar
        });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } });
      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
      res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      next(error);
    }
  }
);

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
// El usuario escribe su email → le enviamos un link para resetear la contraseña
router.post("/forgot-password", emailLimiter, async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Respuesta genérica: no revelar si el email existe (protección de privacidad)
    const genericResponse = { message: "Si el email existe, recibirás instrucciones para restablecer tu contraseña." };

    if (!user) return res.json(genericResponse);

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // El link lleva al frontend, que tiene el formulario de nueva contraseña
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail(email, "Restablece tu contraseña en NebulaWear", resetPasswordTemplate(user.name, resetUrl));

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────
// El usuario envía el token (de la URL) + la nueva contraseña
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token requerido"),
    body("newPassword").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { token, newPassword } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { resetToken: token } });

      if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        return res.status(400).json({ error: "El enlace ha expirado o es inválido. Solicita uno nuevo." });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña + limpiar token
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, resetToken: null, resetTokenExpiry: null },
      });

      // Invalidar todas las sesiones activas por seguridad (logout en todos los dispositivos)
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

      res.json({ message: "Contraseña actualizada. Ahora puedes iniciar sesión." });
    } catch (error) {
      next(error);
    }
  }
);

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post("/refresh", async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "No hay refresh token" });

  try {
    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!storedToken) return res.status(403).json({ error: "Refresh token inválido o revocado" });

    const payload = jwt.verify(token, process.env.REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(403).json({ error: "Usuario no encontrado" });

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Refresh token expirado" });
    }
    next(error);
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post("/logout", async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      await prisma.refreshToken.deleteMany({ where: { token } });
    } catch (error) {
      next(error);
    }
  }
  res.clearCookie("refreshToken", COOKIE_OPTIONS);
  res.json({ message: "Sesión cerrada exitosamente" });
});

module.exports = router;
