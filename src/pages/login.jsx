import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../services/authService';
import { resendVerification } from '../services/authService';
import useAuthStore from '../store/authStore';

const Login = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showResend, setShowResend] = useState(false); // mostrar botón de reenviar email
    const [resending, setResending] = useState(false);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setShowResend(false);

        try {
            const res = await loginUser(form);
            const { accessToken, user } = res.data;
            setAuth(user, accessToken);
            toast.success(`¡Bienvenido, ${user.name}! 👋`);
            navigate('/');
        } catch (err) {
            const data = err.response?.data;

            // Si el backend devuelve code EMAIL_NOT_VERIFIED → mostrar opción de reenviar
            if (data?.code === 'EMAIL_NOT_VERIFIED') {
                toast.warning('Verifica tu email antes de iniciar sesión.');
                setShowResend(true);
            } else {
                toast.error(data?.error || 'Error al iniciar sesión');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            await resendVerification(form.email);
            toast.success('Email de verificación reenviado. Revisa tu bandeja.');
        } catch {
            toast.error('Error al reenviar. Intenta de nuevo más tarde.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">

                    {/* Logo / Header */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">◐</div>
                        <h1 className="text-2xl font-bold text-white">Iniciar Sesión</h1>
                        <p className="text-slate-400 text-sm mt-1">Bienvenido de vuelta a NebulaWear</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="tu@email.com"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-slate-300">Contraseña</label>
                                <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>

                        {/* Aviso de email no verificado + botón de reenviar */}
                        {showResend && (
                            <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg px-4 py-3 text-sm">
                                <p className="text-amber-300 mb-2">📧 Tu email no está verificado.</p>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="text-cyan-400 hover:text-cyan-300 font-medium underline disabled:opacity-60"
                                >
                                    {resending ? 'Enviando...' : 'Reenviar email de verificación'}
                                </button>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-linear-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 text-sm mt-6">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition">
                            Regístrate
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
