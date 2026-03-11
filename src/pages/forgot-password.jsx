import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false); // Mostrar pantalla de confirmación

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:3001/auth/forgot-password', { email });
            setSent(true); // Siempre mostramos confirmación (respuesta genérica del backend)
        } catch {
            toast.error('Error al procesar la solicitud. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">

                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">◐</div>
                        <h1 className="text-2xl font-bold text-white">¿Olvidaste tu contraseña?</h1>
                        <p className="text-slate-400 text-sm mt-1">Te enviaremos un link para restablecerla</p>
                    </div>

                    {!sent ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="tu@email.com"
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-linear-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-60"
                            >
                                {loading ? 'Enviando...' : 'Enviar instrucciones'}
                            </button>
                        </form>
                    ) : (
                        /* Pantalla de confirmación — respuesta siempre igual para no revelar si el email existe */
                        <div className="text-center">
                            <div className="text-4xl mb-4">📧</div>
                            <p className="text-slate-300 mb-2 font-medium">Revisa tu bandeja de entrada</p>
                            <p className="text-slate-400 text-sm mb-6">
                                Si <span className="text-cyan-400">{email}</span> está registrado,
                                recibirás las instrucciones en los próximos minutos. Revisa también tu carpeta de spam.
                            </p>
                        </div>
                    )}

                    <p className="text-center text-slate-400 text-sm mt-6">
                        <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition">
                            ← Volver al login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
