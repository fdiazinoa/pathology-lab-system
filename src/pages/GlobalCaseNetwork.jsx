import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Upload, Globe, MessageSquare, ThumbsUp, Activity, Database, BrainCircuit, Search, CheckCircle } from 'lucide-react';
import { useData } from '../services/DataContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const GlobalCaseNetwork = () => {
    const navigate = useNavigate();
    const { globalCases, cases, publishToGlobal, currentUser } = useData();
    const [activeTab, setActiveTab] = useState('feed'); // feed, upload, stats

    // Upload state
    const [selectedCaseId, setSelectedCaseId] = useState('');
    const [description, setDescription] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState(false);

    const modelStats = [
        { name: 'Precisión Global', value: 94.5 },
        { name: 'Casos Entrenados', value: 12500 + (globalCases.length * 10) },
        { name: 'Labs Conectados', value: 42 }
    ];

    const contributionData = [
        { name: 'Europa', value: 400 },
        { name: 'Norteamérica', value: 300 },
        { name: 'Latam', value: 300 + (globalCases.filter(c => c.country === 'República Dominicana').length * 10) },
        { name: 'Asia', value: 200 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const handlePublish = async (e) => {
        e.preventDefault();
        if (!selectedCaseId) return;

        setIsPublishing(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const result = publishToGlobal(selectedCaseId, description);

        setIsPublishing(false);
        if (result.success) {
            setPublishSuccess(true);
            setSelectedCaseId('');
            setDescription('');
            setTimeout(() => {
                setPublishSuccess(false);
                setActiveTab('feed');
            }, 2000);
        } else {
            alert(result.message);
        }
    };

    const finalCases = cases.filter(c => c.status === 'Finalizado' || c.status === 'Listo para despacho');

    return (
        <div className="space-y-6 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <Globe className="text-primary" /> Red Global de Casos Raros
                    </h1>
                    <p className="text-text-secondary">Conectando laboratorios para compartir conocimiento y entrenar IA federada.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={activeTab === 'feed' ? 'primary' : 'outline'} onClick={() => setActiveTab('feed')}>
                        Explorar Casos
                    </Button>
                    <Button variant={activeTab === 'upload' ? 'primary' : 'outline'} onClick={() => setActiveTab('upload')}>
                        <Upload size={18} className="mr-2" /> Subir Consulta
                    </Button>
                    <Button variant={activeTab === 'stats' ? 'primary' : 'outline'} onClick={() => setActiveTab('stats')}>
                        <Activity size={18} className="mr-2" /> Modelo Global
                    </Button>
                </div>
            </div>

            {activeTab === 'feed' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {globalCases.map((c) => (
                        <Card key={c.id} className="overflow-hidden flex flex-col h-full animate-fade-in">
                            <div className="h-48 bg-gray-200 -mx-6 -mt-6 mb-4 relative">
                                <img src={c.imageUrl} alt={c.diagnosis} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    {c.country}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-primary mb-1">{c.diagnosis}</h3>
                                <p className="text-sm text-text-secondary mb-2">{c.institution}</p>
                                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{c.description}</p>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-border mt-auto">
                                <div className="flex gap-4 text-text-secondary text-sm">
                                    <span className="flex items-center gap-1"><ThumbsUp size={14} /> {c.likes}</span>
                                    <span className="flex items-center gap-1"><MessageSquare size={14} /> {c.comments}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => navigate(`/cases/${c.id}`)}>Ver Detalles</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {activeTab === 'upload' && (
                <div className="max-w-2xl mx-auto">
                    <Card title="Compartir Caso con la Red Global">
                        {publishSuccess ? (
                            <div className="py-12 text-center space-y-4">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-text-main">¡Caso Publicado Exitosamente!</h3>
                                <p className="text-text-secondary">Tu caso ahora es visible para la comunidad global de patólogos.</p>
                            </div>
                        ) : (
                            <form onSubmit={handlePublish} className="space-y-6">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                                    <BrainCircuit className="text-blue-600 shrink-0" size={20} />
                                    <p className="text-xs text-blue-800">
                                        <strong>Privacidad Garantizada:</strong> Al publicar, el sistema anonimiza automáticamente el nombre, ID y datos sensibles del paciente. Solo se compartirá el diagnóstico, órgano e imágenes.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Seleccionar Caso Finalizado</label>
                                    <select
                                        className="w-full p-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-primary bg-white"
                                        value={selectedCaseId}
                                        onChange={(e) => setSelectedCaseId(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccione un caso...</option>
                                        {finalCases.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.id} - {c.diagnosis} ({c.organ})
                                            </option>
                                        ))}
                                    </select>
                                    {finalCases.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">No hay casos finalizados disponibles para compartir.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-main mb-1">Descripción para la Comunidad (Opcional)</label>
                                    <textarea
                                        className="w-full p-2 border border-border rounded-md outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                                        placeholder="Describa por qué este caso es relevante o qué dudas tiene..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button type="button" variant="secondary" onClick={() => setActiveTab('feed')}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" isLoading={isPublishing} disabled={!selectedCaseId}>
                                        <Share2 size={18} className="mr-2" />
                                        Publicar en la Red
                                    </Button>
                                </div>
                            </form>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'stats' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Estado del Modelo Federado">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <BrainCircuit className="mx-auto text-blue-600 mb-2" />
                                <div className="text-2xl font-bold text-blue-800">{modelStats[0].value}%</div>
                                <div className="text-xs text-blue-600">{modelStats[0].name}</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <Database className="mx-auto text-green-600 mb-2" />
                                <div className="text-2xl font-bold text-green-800">{(modelStats[1].value / 1000).toFixed(1)}k</div>
                                <div className="text-xs text-green-600">{modelStats[1].name}</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <Globe className="mx-auto text-purple-600 mb-2" />
                                <div className="text-2xl font-bold text-purple-800">{modelStats[2].value}</div>
                                <div className="text-xs text-purple-600">{modelStats[2].name}</div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            El modelo global se actualiza cada 24 horas con los pesos sinápticos compartidos por los laboratorios participantes, garantizando la privacidad de los datos locales.
                        </p>
                    </Card>

                    <Card title="Contribución por Región">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={contributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {contributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default GlobalCaseNetwork;

