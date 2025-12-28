import React from 'react';

const AIHeatmapOverlay = ({ data, visible, scale }) => {
    if (!visible || !data || data.length === 0) return null;

    const getColor = (prob) => {
        if (prob >= 0.9) return 'rgba(255, 0, 0, 0.5)'; // Red - High
        if (prob >= 0.7) return 'rgba(255, 165, 0, 0.5)'; // Orange - Medium
        if (prob >= 0.5) return 'rgba(255, 255, 0, 0.5)'; // Yellow - Low
        return 'rgba(0, 255, 255, 0.4)'; // Cyan - Very Low
    };

    const getBorderColor = (prob) => {
        if (prob >= 0.9) return 'rgba(255, 0, 0, 1)';
        if (prob >= 0.7) return 'rgba(255, 165, 0, 1)';
        if (prob >= 0.5) return 'rgba(255, 255, 0, 1)';
        return 'rgba(0, 255, 255, 0.8)';
    };

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
            <svg width="100%" height="100%" className="overflow-visible">
                {data.map((region) => (
                    <g
                        key={region.id}
                        className="animate-pulse-slow"
                    >
                        <circle
                            cx={`${region.x}%`}
                            cy={`${region.y}%`}
                            r={`${region.radius * 1.5}%`}
                            fill={getColor(region.probability)}
                            stroke={getBorderColor(region.probability)}
                            strokeWidth={3 / (scale || 1)}
                        />
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default AIHeatmapOverlay;
