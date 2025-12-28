import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, Edit, ArrowLeft, Download, Check, FileSignature, Lock, QrCode, History } from 'lucide-react';
import Button from '../components/Button';
import { useData } from '../services/DataContext';
import { QRCodeCanvas } from 'qrcode.react';

const ReportView = () => {
    const { id } = useParams();
    const { getCase, updateCase, settings, doctors, cases, currentUser } = useData();
    const [isReleasing, setIsReleasing] = useState(false);

    const caseData = getCase(id);
    const assignedDoctor = caseData && doctors ? doctors.find(d => d.id === caseData.doctorId) : null;

    if (!caseData) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-xl font-bold text-text-main">Caso no encontrado</h2>
                <Link to="/dashboard" className="text-primary hover:underline mt-4 block">Volver al inicio</Link>
            </div>
        );
    }

    const isReleased = caseData.status === 'Listo para despacho' || caseData.status === 'Entregado';

    const handleRelease = async () => {
        if (!caseData.diagnosis || caseData.diagnosis.trim() === '') {
            alert("No se puede validar ni firmar un informe sin un diagnóstico definitivo.");
            return;
        }

        if (!window.confirm("¿Está seguro de que desea VALIDAR y FIRMAR este informe? Esta acción no se puede deshacer y habilitará el despacho del resultado.")) {
            return;
        }

        setIsReleasing(true);

        // Simulate cryptographic signing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const digitalSignature = `SIG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const updatedCase = {
            ...caseData,
            status: 'Listo para despacho',
            releasedAt: new Date().toISOString(),
            releasedBy: currentUser ? currentUser.name : 'Sistema',
            digitalSignature: digitalSignature,
            auditLogs: [
                ...caseData.auditLogs,
                {
                    date: new Date().toISOString(),
                    user: currentUser ? currentUser.name : 'Sistema',
                    action: 'Liberación de Resultados',
                    details: `Informe validado y firmado digitalmente. Firma: ${digitalSignature}`
                }
            ]
        };

        updateCase(updatedCase);
        setIsReleasing(false);
        alert("Informe validado y liberado exitosamente.");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <Link to={caseData.type === 'Consulta Global' ? '/global-network' : '/dashboard'}>
                        <Button variant="ghost">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-text-main">Informe Patológico</h1>
                    {isReleased && (
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-green-200">
                            <Lock size={12} />
                            FIRMADO Y LIBERADO
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    {!isReleased && (
                        <Link to={`/cases/${id}/edit`}>
                            <Button variant="secondary">
                                <Edit size={18} className="mr-2" />
                                Editar
                            </Button>
                        </Link>
                    )}

                    {!isReleased && (
                        <Button
                            onClick={handleRelease}
                            isLoading={isReleasing}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <FileSignature size={18} className="mr-2" />
                            Validar y Firmar
                        </Button>
                    )}

                    <Button variant="secondary" onClick={() => window.print()}>
                        <Printer size={18} className="mr-2" />
                        Imprimir
                    </Button>
                    <Button>
                        <Download size={18} className="mr-2" />
                        Exportar PDF
                    </Button>
                </div>
            </div>

            {/* Report Paper */}
            <div className={`bg-white shadow-lg p-12 min-h-[1000px] print:shadow-none print:p-0 relative printable-manifest ${settings.paperSize === 'Letter' ? 'paper-letter' : 'paper-a4'}`}>
                {/* Watermark if not released */}
                {!isReleased && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
                        <p className="text-9xl font-bold -rotate-45">BORRADOR</p>
                    </div>
                )}

                {/* Header */}
                <div className="border-b-2 border-primary pb-6 mb-8 flex justify-between items-end relative z-10">
                    <div className="flex items-center gap-4">
                        {settings.logo && (
                            <img src={settings.logo} alt="Logo" className="h-16 object-contain" />
                        )}
                        <div>
                            <h2 className="text-3xl font-bold text-primary">{settings.name}</h2>
                            <p className="text-text-secondary">Laboratorio de Anatomía Patológica</p>
                            <p className="text-sm text-text-secondary mt-2">{settings.address}</p>
                            <p className="text-sm text-text-secondary">Tel: {settings.phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xl font-bold text-text-main">INFORME FINAL</h3>
                        <p className="text-lg font-mono text-text-secondary mt-1">{caseData.id}</p>
                        <div className="mt-2 flex justify-end">
                            <QRCodeCanvas value={caseData.id} size={64} />
                        </div>
                    </div>
                </div>

                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm relative z-10">
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="font-bold text-text-secondary">Paciente:</span>
                        <span className="font-medium">{caseData.patientName}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="font-bold text-text-secondary">ID Paciente:</span>
                        <span className="font-medium">{caseData.patientId}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="font-bold text-text-secondary">Edad/Sexo:</span>
                        <span className="font-medium">{caseData.age} años / {caseData.sex}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="font-bold text-text-secondary">Fecha Recepción:</span>
                        <span className="font-medium">{new Date(caseData.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="font-bold text-text-secondary">Médico Remitente:</span>
                        <span className="font-medium">Dr. Remitente</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 py-1">
                        <span className="font-bold text-text-secondary">Tipo de Estudio:</span>
                        <span className="font-medium">{caseData.type}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-8 relative z-10">
                    <section>
                        <h4 className="font-bold text-primary uppercase text-sm tracking-wider mb-2">Datos Clínicos</h4>
                        <p className="text-text-main leading-relaxed">{caseData.clinicalData || "No referidos."}</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-primary uppercase text-sm tracking-wider mb-2">Muestra Recibida (Macroscopía)</h4>
                        <p className="text-text-main leading-relaxed">{caseData.macroscopy || "Sin descripción macroscópica."}</p>
                    </section>

                    <section>
                        <h4 className="font-bold text-primary uppercase text-sm tracking-wider mb-2">Descripción Microscópica</h4>
                        <p className="text-text-main leading-relaxed">{caseData.microscopy || "Sin descripción microscópica."}</p>
                    </section>

                    {caseData.ihc && (
                        <section>
                            <h4 className="font-bold text-primary uppercase text-sm tracking-wider mb-2">Inmunohistoquímica</h4>
                            <p className="text-text-main leading-relaxed whitespace-pre-wrap">{caseData.ihc}</p>
                        </section>
                    )}

                    {settings.printImagesInReport && caseData.images && caseData.images.length > 0 && (
                        <section>
                            <h4 className="font-bold text-primary uppercase text-sm tracking-wider mb-4">Imágenes del Estudio</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {caseData.images.map((img, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden break-inside-avoid">
                                        <img
                                            src={img.url}
                                            alt={img.name || `Imagen ${index + 1}`}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="p-2 bg-gray-50 text-xs text-text-secondary border-t border-gray-200">
                                            Imagen {index + 1}: {img.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <div className="border-t-2 border-gray-100 my-8"></div>

                    <section className="bg-gray-50 p-6 rounded-lg border border-gray-100 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-primary uppercase text-sm tracking-wider">Diagnóstico</h4>
                            {caseData.aiCertified && (
                                <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 shadow-sm">
                                    <Check size={14} />
                                    CERTIFICADO POR IA
                                </div>
                            )}
                        </div>
                        <div className="text-lg font-bold text-text-main leading-relaxed whitespace-pre-wrap">
                            {caseData.diagnosis}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-24 pt-8 border-t border-gray-200 flex justify-between items-end relative z-10">
                    <div className="text-xs text-text-secondary max-w-xs">
                        {isReleased ? (
                            <>
                                <p className="font-bold text-green-700 mb-1">DOCUMENTO FIRMADO DIGITALMENTE</p>
                                <p>Firma: <span className="font-mono">{caseData.digitalSignature}</span></p>
                                <p>Fecha de Firma: {new Date(caseData.releasedAt).toLocaleString()}</p>
                                <p>Firmado por: {caseData.releasedBy}</p>
                            </>
                        ) : (
                            <p className="italic text-gray-400">Este documento es un borrador y no tiene validez clínica hasta su firma.</p>
                        )}
                    </div>
                    <div className="text-center">
                        <div className="mb-2">
                            {assignedDoctor && assignedDoctor.signatureUrl ? (
                                <img src={assignedDoctor.signatureUrl} alt="Signature" className="h-12 opacity-80 mx-auto" />
                            ) : (
                                <div className="h-12 w-32 mx-auto border-b border-gray-400 opacity-30"></div>
                            )}
                        </div>
                        <p className="font-bold text-text-main">
                            {assignedDoctor ? assignedDoctor.name : "Dr. No Asignado"}
                        </p>
                        <p className="text-xs text-text-secondary">
                            {assignedDoctor ? `Patólogo - ${assignedDoctor.license}` : "Firma Autorizada"}
                        </p>
                    </div>
                </div>

                {/* Audit History Section (Internal Use) */}
                <div className="mt-12 pt-8 border-t border-dashed border-gray-200 no-print">
                    <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                        <History size={16} />
                        Historial de Auditoría (Uso Interno)
                    </h4>
                    <div className="space-y-3">
                        {(caseData.auditLogs || []).slice().reverse().map((log, index) => (
                            <div key={index} className="flex gap-4 text-xs bg-gray-50 p-3 rounded border border-gray-100">
                                <div className="text-text-secondary font-mono whitespace-nowrap">
                                    {new Date(log.date).toLocaleString()}
                                </div>
                                <div className="font-bold text-primary whitespace-nowrap min-w-[120px]">
                                    {log.user}
                                </div>
                                <div className="flex-1">
                                    <span className="font-bold text-text-main">{log.action}:</span> {log.details}
                                </div>
                            </div>
                        ))}
                        {(!caseData.auditLogs || caseData.auditLogs.length === 0) && (
                            <p className="text-xs text-text-secondary italic">No hay registros de auditoría para este caso.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportView;
