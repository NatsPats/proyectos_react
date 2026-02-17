import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Products from './pages/products';
import Product from './pages/product';
import Cart from './pages/cart';
import NavLink from './components/nav';

const App = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_#020617_0,_#071026_40%,_#000000_100%)] text-slate-200">
      <NavLink />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </div>
  );
};

export default App;