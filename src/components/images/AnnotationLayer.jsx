import React from 'react';

const AnnotationLayer = ({ annotations, imageRef, zoom, rotation, position }) => {
    const [imageBounds, setImageBounds] = React.useState(null);

    React.useEffect(() => {
        if (!imageRef.current) return;

        const updateBounds = () => {
            if (!imageRef.current) return;

            const img = imageRef.current;
            const containerRect = img.getBoundingClientRect();

            // Get natural dimensions
            const naturalWidth = img.naturalWidth || 1000;
            const naturalHeight = img.naturalHeight || 1000;
            const naturalRatio = naturalWidth / naturalHeight;

            // Get container dimensions
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            const containerRatio = containerWidth / containerHeight;

            // Calculate actual rendered image size (with object-fit: contain)
            let renderedWidth, renderedHeight, offsetX, offsetY;

            if (naturalRatio > containerRatio) {
                // Image is wider - fits to width
                renderedWidth = containerWidth;
                renderedHeight = containerWidth / naturalRatio;
                offsetX = 0;
                offsetY = (containerHeight - renderedHeight) / 2;
            } else {
                // Image is taller - fits to height
                renderedHeight = containerHeight;
                renderedWidth = containerHeight * naturalRatio;
                offsetX = (containerWidth - renderedWidth) / 2;
                offsetY = 0;
            }

            setImageBounds({
                width: renderedWidth,
                height: renderedHeight,
                offsetX,
                offsetY,
                naturalWidth,
                naturalHeight
            });
        };

        updateBounds();

        // Update on resize
        const resizeObserver = new ResizeObserver(updateBounds);
        resizeObserver.observe(imageRef.current);

        return () => resizeObserver.disconnect();
    }, [imageRef]);

    if (!imageRef.current || annotations.length === 0 || !imageBounds) return null;

    const { width, height, offsetX, offsetY, naturalWidth, naturalHeight } = imageBounds;

    return (
        <svg
            className="absolute top-0 left-0 pointer-events-none"
            viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
            style={{
                width: `${width}px`,
                height: `${height}px`,
                left: `${offsetX}px`,
                top: `${offsetY}px`,
                zIndex: 10
            }}
        >
            {annotations.map(annotation => {
                // Convert percentage coordinates (0-100) to actual image pixels
                const coords = {
                    x1: (annotation.coordinates.x1 / 100) * naturalWidth,
                    y1: (annotation.coordinates.y1 / 100) * naturalHeight,
                    x2: (annotation.coordinates.x2 / 100) * naturalWidth,
                    y2: (annotation.coordinates.y2 / 100) * naturalHeight,
                    x: (annotation.coordinates.x / 100) * naturalWidth,
                    y: (annotation.coordinates.y / 100) * naturalHeight
                };

                switch (annotation.type) {
                    case 'arrow':
                        return (
                            <g key={annotation.id}>
                                <defs>
                                    <marker
                                        id={`arrowhead-${annotation.id}`}
                                        markerWidth="10"
                                        markerHeight="10"
                                        refX="9"
                                        refY="3"
                                        orient="auto"
                                    >
                                        <polygon
                                            points="0 0, 10 3, 0 6"
                                            fill={annotation.color}
                                        />
                                    </marker>
                                </defs>
                                <line
                                    x1={coords.x1}
                                    y1={coords.y1}
                                    x2={coords.x2}
                                    y2={coords.y2}
                                    stroke={annotation.color}
                                    strokeWidth={naturalWidth * 0.005}
                                    markerEnd={`url(#arrowhead-${annotation.id})`}
                                />
                            </g>
                        );

                    case 'circle':
                        const radius = Math.sqrt(
                            Math.pow(coords.x2 - coords.x1, 2) +
                            Math.pow(coords.y2 - coords.y1, 2)
                        );
                        return (
                            <circle
                                key={annotation.id}
                                cx={coords.x1}
                                cy={coords.y1}
                                r={radius}
                                stroke={annotation.color}
                                strokeWidth={naturalWidth * 0.005}
                                fill="none"
                            />
                        );

                    case 'rectangle':
                        const width = coords.x2 - coords.x1;
                        const height = coords.y2 - coords.y1;
                        return (
                            <rect
                                key={annotation.id}
                                x={Math.min(coords.x1, coords.x2)}
                                y={Math.min(coords.y1, coords.y2)}
                                width={Math.abs(width)}
                                height={Math.abs(height)}
                                stroke={annotation.color}
                                strokeWidth={naturalWidth * 0.005}
                                fill="none"
                            />
                        );

                    case 'text':
                        return (
                            <g key={annotation.id}>
                                <rect
                                    x={coords.x - naturalWidth * 0.02}
                                    y={coords.y - naturalHeight * 0.03}
                                    width={(annotation.text?.length || 0) * naturalWidth * 0.015 + naturalWidth * 0.02}
                                    height={naturalHeight * 0.04}
                                    fill="rgba(0, 0, 0, 0.7)"
                                    rx={naturalWidth * 0.005}
                                />
                                <text
                                    x={coords.x}
                                    y={coords.y}
                                    fill={annotation.color}
                                    fontSize={naturalHeight * 0.025}
                                    fontWeight="bold"
                                >
                                    {annotation.text}
                                </text>
                            </g>
                        );

                    default:
                        return null;
                }
            })}
        </svg>
    );
};

export default AnnotationLayer;
