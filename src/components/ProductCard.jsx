import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import { toast } from 'react-toastify';

export default function ProductCard({ product }) {

  const addItem = useCartStore((s) => s.addItem);

  return (
    <article className="bg-[linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] border border-slate-700 p-4 rounded-3xl flex flex-col gap-4 hover:shadow-lg transition">
      <Link to={`/products/${product.id}`} className="block h-44 flex items-center justify-center">
        <img src={product.image} alt={product.title} className="max-h-36 object-contain transform-gpu hover:scale-105 transition" />
      </Link>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-slate-100 truncate" title={product.title}>{product.title}</h3>
        <p className="mt-2 text-xs text-slate-400">${product.price.toFixed(2)}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button onClick={() => addItem(product)} className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-sm">Añadir</button>
        <Link to={`/products/${product.id}`} className="text-xs text-slate-300 hover:underline">Ver</Link>
      </div>
    </article>
  );
}
