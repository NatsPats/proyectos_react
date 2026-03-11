import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';

const Cart = () => {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const { user, accessToken } = useAuthStore();

  const [loading, setLoading] = useState(false);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    // Si no hay sesión → redirigir a login
    if (!user || !accessToken) {
      toast.info('Debes iniciar sesión para comprar');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        'http://localhost:3001/compras',
        { usuario: user.name, total },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // JWT en el header
          },
        }
      );
      toast.success('¡Compra realizada con éxito! 🎉');
      clearCart();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Tu sesión expiró. Vuelve a iniciar sesión.');
        navigate('/login');
      } else {
        toast.error('Error al procesar la compra');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold text-white mb-6">Carrito de compras</h1>

      {items.length === 0 ? (
        <div className="text-slate-400">Tu carrito está vacío.</div>
      ) : (
        <div className="space-y-6">
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 bg-[rgba(255,255,255,0.02)] p-4 rounded-2xl border border-slate-700">
                <img src={item.image} alt={item.title} className="w-20 h-20 object-contain" />
                <div className="flex-1">
                  <div className="text-white font-semibold">{item.title}</div>
                  <div className="text-sm text-slate-400">${item.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    className="w-16 bg-slate-900 text-slate-200 rounded-md px-2 py-1 border border-slate-700"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                  />
                  <button onClick={() => removeItem(item.id)} className="text-red-400">Eliminar</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between">
            <div className="text-slate-400">Total ({items.reduce((s, i) => s + i.quantity, 0)} items)</div>
            <div className="text-xl font-bold">${total.toFixed(2)}</div>
          </div>

          {/* Aviso si no hay sesión */}
          {!user && (
            <div className="text-sm text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-4 py-2">
              ⚠️ Debes <span className="font-medium underline cursor-pointer" onClick={() => navigate('/login')}>iniciar sesión</span> para completar la compra.
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={clearCart}
              disabled={loading}
              className="px-4 py-2 rounded-full bg-slate-700 text-white disabled:opacity-50"
            >
              Vaciar
            </button>
            <button
              onClick={handleCheckout}
              disabled={loading || items.length === 0}
              className="px-4 py-2 rounded-full bg-linear-to-r from-indigo-500 to-cyan-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando...' : 'Pagar'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Cart;
