import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { labAuth } from '../services/supabaseAuth';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmation: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);
    const submit = async (event) => {
        event.preventDefault();
        if (busy) return;
        if (form.password !== form.confirmation) { setError('Las contraseñas no coinciden.'); return; }
        setError(''); setBusy(true);
        try { await labAuth.register(form); setDone(true); setForm({ name: '', email: '', password: '', confirmation: '' }); }
        catch (error) { setError(error.message || 'No se pudo completar el registro.'); }
        finally { setBusy(false); }
    };
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow p-6 w-full max-w-md">
            <h1 className="text-2xl font-bold mb-3">Crear cuenta</h1>
            <p className="text-sm text-gray-600 mb-5">El registro crea su cuenta del laboratorio. Un administrador debe autorizar su acceso.</p>
            {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
            {done ? <p role="status" className="mb-5">Si el correo puede registrarse, recibirá instrucciones para confirmarlo. Después, solicite autorización al administrador.</p> :
                <form onSubmit={submit} className="space-y-4">
                    {[['name', 'Nombre completo', 'text'], ['email', 'Correo electrónico', 'email'], ['password', 'Contraseña', 'password'], ['confirmation', 'Confirmar contraseña', 'password']].map(([key, label, type]) =>
                        <label key={key} className="block text-sm font-medium">{label}<input className="block w-full border rounded p-2 mt-1" type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required minLength={type === 'password' ? 8 : undefined} autoComplete={type === 'password' ? 'new-password' : key === 'name' ? 'name' : 'email'} disabled={busy} /></label>)}
                    <button disabled={busy} className="bg-blue-600 text-white rounded p-3 w-full">{busy ? 'Registrando...' : 'Registrarse'}</button>
                </form>}
            <Link to="/login" className="block text-blue-700 mt-5">Volver al inicio de sesión</Link>
        </div>
    </div>;
}
