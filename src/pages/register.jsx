import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerUser } from '../services/authService';

const Register = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.password !== form.confirm) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (form.password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            await registerUser({ name: form.name, email: form.email, password: form.password });
            toast.success('¡Cuenta creada! Ahora inicia sesión 🎉');
            navigate('/login');
        } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors?.length) {
                errors.forEach((e) => toast.error(e.msg));
            } else {
                toast.error(err.response?.data?.error || 'Error al registrarse');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                    {/* Logo / Header */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">◐</div>
                        <h1 className="text-2xl font-bold text-white">Crear Cuenta</h1>
                        <p className="text-slate-400 text-sm mt-1">Únete a NebulaWear</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Nombre
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                placeholder="Tu nombre"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Email
                            </label>
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
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="Mínimo 6 caracteres"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                Confirmar Contraseña
                            </label>
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

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-linear-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 text-sm mt-6">
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
