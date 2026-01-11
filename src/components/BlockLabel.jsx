import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const BlockLabel = ({ blockId, caseId, label, date }) => {
    return (
        <div
            className="printable-label flex items-center bg-white border-2 border-black box-border overflow-hidden"
            style={{
                width: '50mm',
                height: '25mm',
                padding: '1mm',
                pageBreakInside: 'avoid'
            }}
        >
            {/* QR Code Section */}
            <div className="flex-shrink-0 mr-2">
                <QRCodeCanvas
                    value={blockId}
                    size={70} // Approx 18-20mm
                    level={"M"}
                />
            </div>

            {/* Text Details Section */}
            <div className="flex flex-col justify-center h-full leading-tight flex-1 overflow-hidden">
                <span className="text-[10px] font-bold font-mono truncate">
                    {caseId}
                </span>
                <span className="text-2xl font-black font-sans truncate">
                    {label}
                </span>
                <span className="text-[8px] font-mono mt-1">
                    {date}
                </span>
            </div>
        </div>
    );
};

export default BlockLabel;
