import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';

const NavLink = () => {
  const items = useCartStore((s) => s.items);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className="bg-gradient-to-r from-slate-900 via-[#071026] to-black/60 border-b border-slate-800 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-black font-bold">◐</div>
          <span className="text-white font-semibold">NebulaWear</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/" className="text-slate-300 hover:text-white">Inicio</Link>
          <Link to="/products" className="text-slate-300 hover:text-white">Productos</Link>
          <Link to="/cart" className="relative text-slate-300 hover:text-white">
            Carrito
            {count > 0 && <span className="absolute -top-2 -right-6 bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">{count}</span>}
          </Link>
        </nav>
      </div>
    </header>
  );
}
export default NavLink;