import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/home';
import Products from './pages/products';
import Product from './pages/product';
import Cart from './pages/cart';
import Login from './pages/login';
import Register from './pages/register';
import VerifyEmail from './pages/verify-email';
import ForgotPassword from './pages/forgot-password';
import ResetPassword from './pages/reset-password';
import NavLink from './components/nav';
import { ToastContainer } from 'react-toastify';
import { refreshToken } from './services/authService';
import useAuthStore from './store/authStore';

const App = () => {
  const { accessToken, setToken, logout } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      refreshToken()
        .then((res) => setToken(res.data.accessToken))
        .catch(() => logout());
    }
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_#020617_0,_#071026_40%,_#000000_100%)] text-slate-200">
      <NavLink />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
      {/*Limite de 5 notificaciones*/}
      <ToastContainer limit={5} />
    </div>
  );
};

export default App;
