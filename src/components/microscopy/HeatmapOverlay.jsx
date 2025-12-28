import React from 'react';

const HeatmapOverlay = ({ data, visible, scale, onRegionClick }) => {
    if (!visible || !data || data.length === 0) return null;

    const getColor = (prob) => {
        if (prob >= 0.9) return 'rgba(255, 0, 0, 0.4)'; // Red - High
        if (prob >= 0.7) return 'rgba(255, 165, 0, 0.4)'; // Orange - Medium
        if (prob >= 0.5) return 'rgba(255, 255, 0, 0.4)'; // Yellow - Low
        return 'rgba(0, 255, 0, 0.2)'; // Green - Very Low
    };

    const getBorderColor = (prob) => {
        if (prob >= 0.9) return 'rgba(255, 0, 0, 0.8)';
        if (prob >= 0.7) return 'rgba(255, 165, 0, 0.8)';
        if (prob >= 0.5) return 'rgba(255, 255, 0, 0.8)';
        return 'rgba(0, 255, 0, 0.6)';
    };

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
            <svg width="100%" height="100%" className="overflow-visible">
                {data.map((region) => (
                    <g
                        key={region.id}
                        className="cursor-pointer pointer-events-auto transition-opacity hover:opacity-80"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRegionClick(region);
                        }}
                    >
                        <circle
                            cx={`${region.x}%`}
                            cy={`${region.y}%`}
                            r={`${region.radius}%`}
                            fill={getColor(region.probability)}
                            stroke={getBorderColor(region.probability)}
                            strokeWidth={2 / scale} // Keep stroke width constant regardless of zoom
                            className="animate-pulse-slow"
                        />
                        {/* Optional: Label on hover could go here, but we'll use a click interaction */}
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default HeatmapOverlay;
