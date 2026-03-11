/**
 * mailer.js — Configuración de Nodemailer para envío de emails
 * 
 * Usa el SMTP de Resend (recomendado).
 * Para activarlo: crea cuenta en resend.com → API Keys → copia la clave
 * y pégala en backend/.env como RESEND_API_KEY
 * 
 * Alternativa Gmail: descomenta la sección Gmail y comenta la de Resend.
 */

const nodemailer = require("nodemailer");

// ── Opción A: Resend (recomendado) ────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 465,
  secure: true,
  auth: {
    user: "resend",                         // siempre "resend"
    pass: process.env.RESEND_API_KEY,       // tu API key de resend.com
  },
});

// ── Opción B: Gmail ───────────────────────────────────────────────────────────
// Para Gmail: ve a tu cuenta Google → Seguridad → Verificación en 2 pasos (actívala)
// → Contraseñas de aplicación → genera una clave de 16 chars
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_FROM,         // tu@gmail.com
//     pass: process.env.GMAIL_APP_PASSWORD, // contraseña de aplicación de 16 chars
//   },
// });

/**
 * Envía un email.
 * @param {string} to - Email del destinatario
 * @param {string} subject - Asunto del email
 * @param {string} html - Cuerpo del email en HTML
 */
const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"NebulaWear" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail };
