import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProductById } from '../services/api';
import useCartStore from '../store/cartStore';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setLoading(true);
    getProductById(id)
      .then((p) => setProduct(p))
      .catch(() => setError('No se encontró el producto.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-20 text-center text-slate-400">Cargando...</div>;
  if (error) return <div className="py-20 text-center text-red-400">{error}</div>;

  return (
    <main className="container mx-auto py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-[rgba(255,255,255,0.02)] p-6 rounded-3xl flex items-center justify-center">
          <img src={product.image} alt={product.title} className="max-h-96 object-contain" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">{product.title}</h1>
          <p className="mt-4 text-slate-300">{product.description}</p>
          <div className="mt-6 flex items-center gap-4">
            <span className="text-3xl font-semibold text-white">${product.price.toFixed(2)}</span>
            <button onClick={() => addItem(product)} className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-white">Añadir al carrito</button>
          </div>
          <p className="mt-4 text-sm text-slate-500">Categoría: <span className="capitalize">{product.category}</span></p>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
