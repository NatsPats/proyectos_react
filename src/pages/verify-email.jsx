import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

/**
 * Página a la que llega el usuario al hacer click en el link del email.
 * Lee el query param ?status=success|invalid y muestra el mensaje correspondiente.
 */
const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const status = searchParams.get('status'); // 'success' | 'invalid' | null

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md text-center">
                <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-10 shadow-2xl backdrop-blur-sm">

                    {status === 'success' && (
                        <>
                            <div className="text-5xl mb-4">✅</div>
                            <h1 className="text-2xl font-bold text-white mb-3">¡Email verificado!</h1>
                            <p className="text-slate-400 mb-8">Tu cuenta está activa. Ya puedes iniciar sesión.</p>
                            <Link
                                to="/login"
                                className="inline-block bg-linear-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold px-8 py-2.5 rounded-lg transition"
                            >
                                Ir al login
                            </Link>
                        </>
                    )}

                    {status === 'invalid' && (
                        <>
                            <div className="text-5xl mb-4">❌</div>
                            <h1 className="text-2xl font-bold text-white mb-3">Enlace inválido o expirado</h1>
                            <p className="text-slate-400 mb-8">
                                El enlace de verificación expiró (24h) o ya fue usado.
                                Inicia sesión para que te enviemos uno nuevo.
                            </p>
                            <Link
                                to="/login"
                                className="inline-block bg-slate-700 hover:bg-slate-600 text-white font-semibold px-8 py-2.5 rounded-lg transition"
                            >
                                Ir al login
                            </Link>
                        </>
                    )}

                    {!status && (
                        <>
                            <div className="text-5xl mb-4">📧</div>
                            <h1 className="text-2xl font-bold text-white mb-3">Verifica tu email</h1>
                            <p className="text-slate-400">
                                Te enviamos un link de verificación. Revisa tu bandeja de entrada (y la carpeta spam).
                            </p>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
