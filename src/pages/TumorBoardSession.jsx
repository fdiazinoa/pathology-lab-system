import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, MessageSquare, FileText, CheckCircle, Save, PenTool } from 'lucide-react';
import { useData } from '../services/DataContext';
import Button from '../components/Button';
import Card from '../components/Card';

const TumorBoardSession = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { getCase, updateCaseTumorBoard, doctors } = useData();
    const [currentCase, setCurrentCase] = useState(null);
    const [activeTab, setActiveTab] = useState('presentation'); // presentation, discussion, consensus
    const [newComment, setNewComment] = useState('');
    const [consensusText, setConsensusText] = useState('');

    useEffect(() => {
        const c = getCase(id);
        if (c) {
            setCurrentCase(c);
            if (c.tumorBoard?.consensus) {
                setConsensusText(c.tumorBoard.consensus);
            }
        }
    }, [id, getCase]);

    if (!currentCase || !currentCase.tumorBoard) return <div>Cargando...</div>;

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const comment = {
            author: 'Dr. Moderador',
            text: newComment,
            timestamp: new Date().toISOString()
        };
        const updatedBoard = {
            ...currentCase.tumorBoard,
            notes: [...currentCase.tumorBoard.notes, comment]
        };
        updateCaseTumorBoard(currentCase.id, updatedBoard);
        setCurrentCase(prev => ({ ...prev, tumorBoard: updatedBoard }));
        setNewComment('');
    };

    const handleFinalize = () => {
        if (!window.confirm('¿Está seguro de finalizar la sesión y firmar el consenso?')) return;
        const updatedBoard = {
            ...currentCase.tumorBoard,
            status: 'Concluded',
            consensus: consensusText,
            concludedAt: new Date().toISOString()
        };
        updateCaseTumorBoard(currentCase.id, updatedBoard);
        navigate('/tumor-board');
    };

    return (
        <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/tumor-board')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Sesión de Tumor Board: {currentCase.patientName}</h1>
                        <p className="text-xs text-gray-500">ID: {currentCase.id} • {currentCase.organ}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === 'presentation' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('presentation')}
                    >
                        <FileText size={18} className="mr-2" />
                        Presentación
                    </Button>
                    <Button
                        variant={activeTab === 'discussion' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('discussion')}
                    >
                        <MessageSquare size={18} className="mr-2" />
                        Discusión
                    </Button>
                    <Button
                        variant={activeTab === 'consensus' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('consensus')}
                    >
                        <PenTool size={18} className="mr-2" />
                        Consenso
                    </Button>
                </div>
                <div>
                    {currentCase.tumorBoard.status !== 'Concluded' && (
                        <Button variant="danger" onClick={handleFinalize}>
                            <CheckCircle size={18} className="mr-2" />
                            Finalizar Sesión
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Clinical Context & Images */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'presentation' && (
                        <div className="space-y-6">
                            <Card title="Imágenes del Caso">
                                {currentCase.images && currentCase.images.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentCase.images.map((img, idx) => (
                                            <div key={idx} className="border rounded-lg overflow-hidden shadow-sm">
                                                <img src={img.preview} alt={`Slide ${idx}`} className="w-full h-64 object-cover" />
                                                <div className="p-2 bg-gray-50 text-xs text-center font-medium text-gray-600">
                                                    {img.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-gray-50 rounded border border-dashed text-gray-400">
                                        No hay imágenes disponibles.
                                    </div>
                                )}
                            </Card>
                            <Card title="Resumen Clínico">
                                <p className="text-gray-700 whitespace-pre-line">{currentCase.clinicalData || 'Sin datos clínicos.'}</p>
                            </Card>
                            <Card title="Diagnóstico Preliminar">
                                <p className="text-gray-700 font-medium">{currentCase.diagnosis || 'Pendiente'}</p>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'discussion' && (
                        <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="p-4 border-b border-gray-200 font-bold flex items-center gap-2 bg-gray-50 rounded-t-xl">
                                <Users size={20} />
                                Notas de la Sesión
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {currentCase.tumorBoard.notes.length === 0 && (
                                    <div className="text-center text-gray-400 italic mt-10">Inicie la discusión...</div>
                                )}
                                {currentCase.tumorBoard.notes.map((note, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                            {note.author.substring(0, 2)}
                                        </div>
                                        <div className="flex-1 bg-gray-50 p-3 rounded-lg rounded-tl-none">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-sm text-gray-800">{note.author}</span>
                                                <span className="text-xs text-gray-400">{new Date(note.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{note.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Agregar nota o comentario..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                        disabled={currentCase.tumorBoard.status === 'Concluded'}
                                    />
                                    <Button onClick={handleAddComment} disabled={currentCase.tumorBoard.status === 'Concluded'}>
                                        Enviar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'consensus' && (
                        <div className="max-w-3xl mx-auto space-y-6">
                            <Card title="Consenso del Comité">
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">
                                        Redacte las conclusiones finales, recomendaciones terapéuticas y el estadio acordado por el comité.
                                    </p>
                                    <textarea
                                        className="w-full h-64 p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none resize-none"
                                        placeholder="Escriba el consenso aquí..."
                                        value={consensusText}
                                        onChange={(e) => setConsensusText(e.target.value)}
                                        readOnly={currentCase.tumorBoard.status === 'Concluded'}
                                    ></textarea>
                                </div>
                            </Card>

                            {currentCase.tumorBoard.status === 'Concluded' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800">
                                    <CheckCircle size={24} />
                                    <div>
                                        <h4 className="font-bold">Sesión Finalizada</h4>
                                        <p className="text-sm">Firmado digitalmente el {new Date(currentCase.tumorBoard.concludedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TumorBoardSession;
