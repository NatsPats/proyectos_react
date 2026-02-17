import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProducts(category === 'all' ? null : category)
      .then((data) => setProducts(data))
      .catch(() => setError('No se pudieron cargar los productos.'))
      .finally(() => setLoading(false));
  }, [category]);

  const filtered = products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="container mx-auto py-8 px-4">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Colección espacial — Minimal & Futurista</h1>
          <p className="text-slate-400 mt-1">Ropa con líneas limpias y estética futurista. Explora y añade tus favoritos.</p>
        </div>

        <div className="flex gap-2 items-center">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-slate-900 text-slate-200 px-3 py-2 rounded-lg border border-slate-700">
            <option value="all">Todas</option>
            <option value="men's clothing">Hombre</option>
            <option value="women's clothing">Mujer</option>
            <option value="jewelery">Accesorios</option>
            <option value="electronics">Electrónica</option>
          </select>

          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..." className="bg-slate-900 text-slate-200 px-3 py-2 rounded-lg border border-slate-700" />
        </div>
      </header>

      {loading && <div className="py-20 text-center text-slate-400">Cargando productos...</div>}
      {error && <div className="text-red-400">{error}</div>}

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </section>

      {!loading && filtered.length === 0 && <div className="py-12 text-center text-slate-500">No se encontraron productos.</div>}
    </main>
  );
};

export default Products;