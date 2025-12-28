import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 bg-red-50 text-red-900 min-h-screen">
                    <h1 className="text-3xl font-bold mb-4">Algo salió mal.</h1>
                    <p className="mb-4">La aplicación ha encontrado un error crítico.</p>
                    <div className="bg-white p-4 rounded border border-red-200 overflow-auto">
                        <pre className="text-sm font-mono text-red-600">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <br />
                        <pre className="text-xs font-mono text-gray-500">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={() => window.location.href = '/'}
                    >
                        Recargar Aplicación
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
