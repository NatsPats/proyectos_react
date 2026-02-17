import { create } from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  addItem: (product) =>
    set((state) => {
      const idx = state.items.findIndex((i) => i.id === product.id);
      if (idx !== -1) {
        const items = state.items.slice();
        items[idx] = { ...items[idx], quantity: items[idx].quantity + 1 };
        return { items };
      }
      return { items: [...state.items, { ...product, quantity: 1 }] };
    }),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateQuantity: (id, qty) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.id === id ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0),
    })),
  clearCart: () => set({ items: [] }),
}));

export default useCartStore;
