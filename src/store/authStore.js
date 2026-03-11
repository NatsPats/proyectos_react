import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * authStore — Estado global de autenticación
 * 
 * Persiste en localStorage para sobrevivir recargas de página.
 * Al recargar: Zustand lee accessToken del localStorage.
 * Si expiró → app.jsx llama /auth/refresh silenciosamente.
 */
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,          // { id, name, email }
      accessToken: null,   // JWT de corta duración (15 min)

      // Llamado al hacer login exitoso
      setAuth: (user, accessToken) => set({ user, accessToken }),

      // Llamado al refrescar el token (solo actualiza el token, no el usuario)
      setToken: (accessToken) => set({ accessToken }),

      // Llamado al hacer logout
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'auth-storage', // Clave en localStorage
    }
  )
);

export default useAuthStore;
