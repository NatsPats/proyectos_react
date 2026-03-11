import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { logoutUser } from '../services/authService';

const NavLink = () => {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logoutUser(); // Elimina cookie + refreshToken de BD
    } catch {
      // Si falla (ej. backend caído), igual hacemos logout local
    }
    logout();
    toast.info('Sesión cerrada');
    navigate('/login');
  };

  return (
    <header className="bg-linear-to-r from-slate-900 via-[#071026] to-black/60 border-b border-slate-800 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-black font-bold">◐</div>
          <span className="text-white font-semibold">NebulaWear</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/" className="text-slate-300 hover:text-white">Inicio</Link>
          <Link to="/products" className="text-slate-300 hover:text-white">Productos</Link>
          <Link to="/cart" className="relative text-slate-300 hover:text-white">
            Carrito
            {count > 0 && (
              <span className="absolute -top-2 -right-6 bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </Link>

          {/* ── Sección de Auth ── */}
          {user ? (
            <div className="flex items-center gap-3 border-l border-slate-700 pl-6">
              <span className="text-slate-300 text-sm">
                Hola, <span className="text-cyan-400 font-medium">{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-l border-slate-700 pl-6">
              <Link
                to="/login"
                className="text-slate-300 hover:text-white text-sm transition"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="text-sm bg-linear-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white px-4 py-1.5 rounded-lg font-medium transition"
              >
                Registro
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default NavLink;