const jwt = require("jsonwebtoken");

/**
 * Middleware de autenticación JWT.
 * Verifica el header: Authorization: Bearer <accessToken>
 * Si es válido, adjunta req.user = { id, email } y llama next().
 * Úsalo en rutas protegidas: router.get('/perfil', protect, handler)
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Acceso denegado. Token requerido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }
    return res.status(401).json({ error: "Token inválido" });
  }
};

module.exports = { protect };