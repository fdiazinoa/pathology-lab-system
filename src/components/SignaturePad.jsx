import React, { useRef, useState, useEffect } from 'react';
import { Eraser } from 'lucide-react';
import Button from './Button';

const SignaturePad = ({ onSave }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
    }, []);

    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e) => {
        e.preventDefault(); // Prevent scrolling on touch
        setIsDrawing(true);
        const { x, y } = getCoords(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = getCoords(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const canvas = canvasRef.current;
            onSave(canvas.toDataURL());
            setHasDrawn(true);
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
        onSave('');
    };

    return (
        <div className="border border-border rounded-lg p-2 bg-white">
            <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full h-32 touch-none cursor-crosshair bg-gray-50 rounded border border-dashed border-gray-200"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-xs text-text-secondary">Dibuje su firma arriba</span>
                <Button type="button" variant="ghost" size="sm" onClick={clear}>
                    <Eraser size={14} className="mr-1" /> Borrar
                </Button>
            </div>
        </div>
    );
};

export default SignaturePad;
