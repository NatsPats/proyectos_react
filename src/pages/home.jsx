import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <main className="min-h-[70vh] flex items-center justify-center">
      <section className="container mx-auto px-4 py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-5xl font-extrabold text-white leading-tight">NebulaWear — Moda espacial minimalista</h1>
          <p className="mt-6 text-slate-400 max-w-lg">Diseños limpios, materiales cómodos y un toque futurista. Compra desde la comodidad y añade tus favoritos al carrito.</p>
          <div className="mt-8 flex gap-4">
            <Link to="/products" className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-black font-semibold">Ver productos</Link>
            <a href="#features" className="px-6 py-3 rounded-full border border-slate-700 text-slate-300">Más info</a>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-80 h-80 rounded-3xl bg-gradient-to-tr from-slate-800/40 to-transparent border border-slate-700 flex items-center justify-center transform-gpu rotate-6">
            <div className="w-56 h-56 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-cyan-400/10 border border-slate-700 flex items-center justify-center text-slate-100 font-semibold">Estética Futurista</div>
          </div>
        </div>
      </section>
    </main>
  );
}
export default Home;