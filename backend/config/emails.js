/**
 * emails.js — Plantillas HTML para los emails transaccionales
 * 
 * Exporta funciones que devuelven el HTML de cada email.
 * Mantener aquí todas las plantillas facilita cambiarlas en el futuro.
 */

/**
 * Email de verificación de cuenta — se envía al registrarse.
 * @param {string} name - Nombre del usuario
 * @param {string} verifyUrl - URL completa con el token de verificación
 */
const verifyEmailTemplate = (name, verifyUrl) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background:#0a0f1e; color:#e2e8f0; padding:40px 0;">
  <div style="max-width:520px; margin:0 auto; background:#0f172a; border:1px solid #1e293b; border-radius:16px; overflow:hidden;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4); padding:32px; text-align:center;">
      <div style="font-size:32px; font-weight:bold; color:#000;">◐</div>
      <h1 style="color:#fff; margin:8px 0 0; font-size:22px;">NebulaWear</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <h2 style="color:#e2e8f0; margin:0 0 12px;">Hola, ${name} 👋</h2>
      <p style="color:#94a3b8; line-height:1.6; margin:0 0 24px;">
        Gracias por registrarte. Solo un paso más: verifica tu email para activar tu cuenta.
      </p>

      <div style="text-align:center; margin:32px 0;">
        <a href="${verifyUrl}"
           style="background:linear-gradient(135deg,#4f46e5,#06b6d4); color:#fff; padding:14px 32px;
                  border-radius:8px; text-decoration:none; font-weight:bold; font-size:15px; display:inline-block;">
          Verificar mi cuenta
        </a>
      </div>

      <p style="color:#64748b; font-size:13px; line-height:1.5;">
        Este enlace expira en <strong style="color:#94a3b8;">24 horas</strong>. 
        Si no creaste esta cuenta, ignora este email.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #1e293b; padding:20px 32px; text-align:center;">
      <p style="color:#475569; font-size:12px; margin:0;">© 2026 NebulaWear. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Email de recuperación de contraseña.
 * @param {string} name - Nombre del usuario
 * @param {string} resetUrl - URL completa con el token de reset
 */
const resetPasswordTemplate = (name, resetUrl) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background:#0a0f1e; color:#e2e8f0; padding:40px 0;">
  <div style="max-width:520px; margin:0 auto; background:#0f172a; border:1px solid #1e293b; border-radius:16px; overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#06b6d4); padding:32px; text-align:center;">
      <div style="font-size:32px; font-weight:bold; color:#000;">◐</div>
      <h1 style="color:#fff; margin:8px 0 0; font-size:22px;">NebulaWear</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <h2 style="color:#e2e8f0; margin:0 0 12px;">Hola, ${name} 🔑</h2>
      <p style="color:#94a3b8; line-height:1.6; margin:0 0 24px;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta. 
        Haz clic en el botón para crear una nueva contraseña.
      </p>

      <div style="text-align:center; margin:32px 0;">
        <a href="${resetUrl}"
           style="background:linear-gradient(135deg,#4f46e5,#06b6d4); color:#fff; padding:14px 32px;
                  border-radius:8px; text-decoration:none; font-weight:bold; font-size:15px; display:inline-block;">
          Restablecer contraseña
        </a>
      </div>

      <p style="color:#64748b; font-size:13px; line-height:1.5;">
        Este enlace expira en <strong style="color:#94a3b8;">1 hora</strong>. 
        Si no solicitaste esto, ignora este email — tu contraseña no cambiará.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #1e293b; padding:20px 32px; text-align:center;">
      <p style="color:#475569; font-size:12px; margin:0;">© 2026 NebulaWear. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = { verifyEmailTemplate, resetPasswordTemplate };
