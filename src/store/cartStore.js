import { create } from 'zustand';
import { toast } from 'react-toastify';

const useCartStore = create((set) => ({
  items: [],
  addItem: (product) =>
    set((state) => {
      const idx = state.items.findIndex((i) => i.id === product.id);
      if (idx !== -1) {
        const items = state.items.slice();
        items[idx] = { ...items[idx], quantity: items[idx].quantity + 1 };
        toast.success('Cantidad actualizada');
        return { items };
      }
      toast.success('Producto agregado al carrito');
      return { items: [...state.items, { ...product, quantity: 1 }] };
    }),

  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  //Mostrar toast al actualizar la cantidad
  updateQuantity: (id, qty) =>
    set((state) => {
      ({
      items: state.items
        .map((i) => (i.id === id ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0),
      }); 
  }),
    
  clearCart: () => set({ items: [] }),
}));

export default useCartStore;
