import useCartStore from '../store/cartStore';

const Cart = () => {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

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
                  <input type="number" min="1" className="w-16 bg-slate-900 text-slate-200 rounded-md px-2 py-1 border border-slate-700" value={item.quantity} onChange={(e) => updateQuantity(item.id, Number(e.target.value))} />
                  <button onClick={() => removeItem(item.id)} className="text-red-400">Eliminar</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between">
            <div className="text-slate-400">Total ({items.reduce((s, i) => s + i.quantity, 0)} items)</div>
            <div className="text-xl font-bold">${total.toFixed(2)}</div>
          </div>

          <div className="flex gap-2">
            <button onClick={clearCart} className="px-4 py-2 rounded-full bg-slate-700 text-white">Vaciar</button>
            <button className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-white">Pagar</button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Cart;
