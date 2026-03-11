import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // token viene en la URL: /reset-password?token=xxxxx
    const navigate = useNavigate();

    const [form, setForm] = useState({ newPassword: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.newPassword !== form.confirm) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (!token) {
            toast.error('Token inválido. Solicita un nuevo enlace de recuperación.');
            return;
        }

        setLoading(true);
        try {
            await axios.post('http://localhost:3001/auth/reset-password', {
                token,
                newPassword: form.newPassword,
            });
            toast.success('¡Contraseña actualizada! Ahora inicia sesión.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.error || 'El enlace expiró. Solicita uno nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Si no hay token en la URL, mostrar error directamente
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center bg-slate-900/80 border border-slate-700/50 rounded-2xl p-10">
                    <div className="text-4xl mb-4">❌</div>
                    <h1 className="text-xl font-bold text-white mb-3">Enlace inválido</h1>
                    <p className="text-slate-400 mb-6">Este enlace no es válido o ya fue usado.</p>
                    <Link to="/forgot-password" className="text-cyan-400 hover:text-cyan-300">
                        Solicitar nuevo enlace →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">

                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">🔑</div>
                        <h1 className="text-2xl font-bold text-white">Nueva contraseña</h1>
                        <p className="text-slate-400 text-sm mt-1">Elige una contraseña segura</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nueva contraseña</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={form.newPassword}
                                onChange={handleChange}
                                required
                                placeholder="Mínimo 6 caracteres"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar contraseña</label>
                            <input
                                type="password"
                                name="confirm"
                                value={form.confirm}
                                onChange={handleChange}
                                required
                                placeholder="Repite la contraseña"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-linear-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-60"
                        >
                            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
