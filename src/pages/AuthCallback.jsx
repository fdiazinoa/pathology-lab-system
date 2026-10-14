import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { labAuth } from '../services/supabaseAuth';
import { supabase } from '../services/supabaseClient';

export default function AuthCallback() {
    const [message, setMessage] = useState('Verificando su acceso...');
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const params = new URLSearchParams(window.location.hash.slice(1));
                const query = new URLSearchParams(window.location.search);
                const oauthError = params.get('error_description') || query.get('error_description');
                if (oauthError) throw new Error(oauthError);
                const user = await labAuth.authorizedUser();
                if (cancelled) return;
                if (!user) {
                    await supabase.auth.signOut();
                    if (!cancelled) setMessage('Su cuenta está confirmada, pero el acceso está pendiente de autorización por el administrador.');
                    return;
                }
                localStorage.setItem('app_system_mode', 'SUPABASE');
                localStorage.setItem('setupCompleted', 'true');
                window.location.replace('/dashboard');
            } catch (error) {
                if (!cancelled) { await supabase.auth.signOut(); setMessage(error.message || 'No se pudo verificar el acceso.'); }
            }
        })();
        return () => { cancelled = true; };
    }, []);
    return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"><h1 className="text-xl font-bold mb-4">Acceso al laboratorio</h1><p role="status">{message}</p><Link to="/login" className="text-blue-700 mt-5">Volver al inicio de sesión</Link></div>;
}
