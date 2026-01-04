import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../services/DataContext';
import { AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
    const navigate = useNavigate();
    const { login, loginWithGoogle, loginWithGoogleProfile, settings } = useData();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Ocurrió un error al intentar iniciar sesión.');
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        scope: "email profile openid",
        onSuccess: async (tokenResponse) => {
            console.log("Google Login Success:", tokenResponse);

            try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });

                if (!userInfoResponse.ok) {
                    throw new Error(`Failed to fetch user info: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
                }

                const userInfo = await userInfoResponse.json();
                console.log("Google User Info:", userInfo);

                const result = await loginWithGoogleProfile(userInfo);
                if (result.success) {
                    navigate('/dashboard');
                } else {
                    setError(result.message);
                }

            } catch (error) {
                console.error("Error fetching Google user info:", error);
                setError(`Error de Google: ${error.message || 'Desconocido'}`);
            }
        },
        onError: errorResponse => {
            console.error("Google Login Failed:", errorResponse);
            setError(`Error al iniciar sesión con Google: ${JSON.stringify(errorResponse)}`);
        },
    });

    const handleSocialLogin = (provider) => {
        if (provider === 'Google') {
            googleLogin();
        } else {
            alert(`La integración con ${provider} se configurará en la siguiente fase.`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xs mx-auto rounded-2xl shadow-xl border border-blue-100 p-6 relative overflow-hidden">
                {/* Top Border Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        {settings.logo ? (
                            <img src={settings.logo} alt="Logo" className="h-12 w-auto object-contain" />
                        ) : (
                            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                                <span className="text-white text-xl font-bold">LP</span>
                            </div>
                        )}
                    </div>
                    <div className="mb-6">
                        <span className="text-xl font-bold text-gray-900 tracking-tight block">
                            {settings.labName || 'PathAI Lab'}
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Bienvenido de vuelta
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Ingresa para acceder a tu panel de control.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-900">
                                Contraseña
                            </label>
                            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ backgroundColor: '#2563eb' }}
                            className="w-full py-3.5 px-4 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] flex justify-center items-center text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="mr-2 animate-spin">⟳</span>
                            ) : null}
                            Iniciar Sesión
                        </button>
                    </div>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider">
                        <span className="bg-white px-4 text-gray-400 font-medium">O continúa con</span>
                    </div>
                </div>

                {/* Social Login */}
                <div className="space-y-3">
                    <button
                        onClick={() => handleSocialLogin('Google')}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all active:scale-[0.99]"
                    >
                        <svg className="h-5 w-5 flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" style={{ minWidth: '20px', minHeight: '20px' }}>
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Iniciar sesión con Google
                    </button>

                    <button
                        onClick={() => handleSocialLogin('Microsoft')}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all active:scale-[0.99]"
                    >
                        <svg className="h-5 w-5 flex-shrink-0" width="20" height="20" viewBox="0 0 21 21" style={{ minWidth: '20px', minHeight: '20px' }}>
                            <path fill="#F25022" d="M1 1H10V10H1z" />
                            <path fill="#7FBA00" d="M11 1H20V10H11z" />
                            <path fill="#00A4EF" d="M1 11H10V20H1z" />
                            <path fill="#FFB900" d="M11 11H20V20H11z" />
                        </svg>
                        Iniciar sesión con Microsoft
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-600">
                        ¿No tienes una cuenta?{' '}
                        <a href="#" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                            Regístrate
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
