import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

import { GoogleOAuthProvider } from '@react-oauth/google';

console.log("🚀 Application Entry Point Reached");

// Placeholder Client ID - User must replace this with their own from Google Cloud Console
const GOOGLE_CLIENT_ID = "59779272886-hckkd4r3simics37ps6iaaeglf58gbeg.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <App />
        </GoogleOAuthProvider>
    </React.StrictMode>,
)
