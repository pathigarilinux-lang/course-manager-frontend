import React from 'react';
import { X, ArrowRight } from 'lucide-react';

const DiningLayout = ({ gender, occupied, selected, onSelect, onClose }) => {
  // We calculate rows based on 200 seats total, 12 seats per row
  const TOTAL_SEATS = 200;
  const SEATS_PER_ROW = 12;
  const totalRows = Math.ceil(TOTAL_SEATS / SEATS_PER_ROW); // Approx 17 rows

  const renderSeat = (seatNum) => {
    if (seatNum > TOTAL_SEATS) return <div className="w-8 h-8 m-0.5 border border-transparent"></div>;

    const isOccupied = occupied.has(String(seatNum));
    const isSelected = String(selected) === String(seatNum);

    return (
      <button
        key={seatNum}
        type="button"
        disabled={isOccupied}
        onClick={() => onSelect(seatNum)}
        className={`
          w-8 h-8 m-0.5 text-xs font-bold border flex items-center justify-center transition-all
          ${isOccupied 
            ? 'bg-red-100 text-red-500 border-red-200 cursor-not-allowed' 
            : isSelected 
              ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-110 z-10' 
              : 'bg-white hover:bg-blue-50 border-gray-400 text-gray-800'}
        `}
      >
        {seatNum}
      </button>
    );
  };

  // Helper to render vertical text for pathway
  const Pathway = () => (
    <div className="mx-2 w-8 bg-blue-600 text-white flex items-center justify-center border border-blue-800 rounded-sm">
      <span className="whitespace-nowrap font-bold text-xs tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        PATHWAY
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gray-100 p-3 border-b flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold text-blue-900 uppercase">{gender} Dining Layout</h2>
            <div className="flex gap-4 text-xs mt-1">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-gray-400"></div> Available</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border border-red-200"></div> Occupied</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-600 border border-blue-700"></div> Selected</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Area */}
        <div className="overflow-auto p-4 bg-gray-50 flex-1 flex justify-center">
          <div className="bg-white border p-4 shadow-sm inline-block min-w-max">
            
            {/* 1. SERVING TABLE (Top) */}
            <div className="w-full bg-blue-600 text-white text-center py-2 font-bold mb-6 rounded-sm uppercase tracking-widest border border-blue-800">
              Serving Table
            </div>

            {/* MAIN LAYOUT ROW */}
            <div className="flex">
              
              {/* --- SECTION 1: CHAIR BLOCK-2 (Seats 12, 11, 10) --- */}
              <div className="flex flex-col">
                <div className="text-center font-bold text-xs mb-1 uppercase text-gray-700">Chair<br/>Block-2</div>
                <div className="border border-gray-300 p-1 bg-gray-50">
                   {/* Header Row */}
                   <div className="flex justify-center border-b border-gray-300 mb-1 pb-1">
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">12</div>
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">11</div>
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">10</div>
                   </div>
                   {/* Rows */}
                   {Array.from({ length: totalRows }).map((_, r) => (
                     <div key={r} className="flex">
                       {renderSeat((r * 12) + 12)}
                       {renderSeat((r * 12) + 11)}
                       {renderSeat((r * 12) + 10)}
                     </div>
                   ))}
                </div>
                {/* ENTRANCE ARROW */}
                <div className="mt-4 bg-blue-600 text-white text-xs font-bold py-2 px-1 text-center clip-path-arrow relative flex items-center justify-center gap-1 shadow-md">
                   <ArrowRight size={16} /> ENTRANCE
                </div>
              </div>

              {/* PATHWAY */}
              <Pathway />

              {/* --- SECTION 2: FLOOR BLOCK-2 (Seats 9, 8) --- */}
              <div className="flex flex-col">
                <div className="text-center font-bold text-xs mb-1 uppercase text-gray-700">Floor<br/>Block-2</div>
                <div className="border border-gray-300 p-1 bg-yellow-50/30">
                   {/* Header Row */}
                   <div className="flex justify-center border-b border-gray-300 mb-1 pb-1">
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">9</div>
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">8</div>
                   </div>
                   {Array.from({ length: totalRows }).map((_, r) => (
                     <div key={r} className="flex">
                       {renderSeat((r * 12) + 9)}
                       {renderSeat((r * 12) + 8)}
                     </div>
                   ))}
                </div>
              </div>

              {/* PATHWAY */}
              <Pathway />

              {/* --- SECTION 3: FLOOR BLOCK-1 (Seats 7, 6, 5, 4) --- */}
              <div className="flex flex-col">
                <div className="text-center font-bold text-xs mb-1 uppercase text-gray-700">Floor<br/>Block-1</div>
                <div className="border border-gray-300 p-1 bg-yellow-50/30">
                   {/* Header Row */}
                   <div className="flex justify-center border-b border-gray-300 mb-1 pb-1">
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">7</div>
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">6</div>
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">5</div>
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">4</div>
                   </div>
                   {Array.from({ length: totalRows }).map((_, r) => (
                     <div key={r} className="flex">
                       {renderSeat((r * 12) + 7)}
                       {renderSeat((r * 12) + 6)}
                       {renderSeat((r * 12) + 5)}
                       {renderSeat((r * 12) + 4)}
                     </div>
                   ))}
                </div>
              </div>

              {/* PATHWAY */}
              <Pathway />

              {/* --- SECTION 4: CHAIR BLOCK-1 (Seats 3, 2, 1) --- */}
              <div className="flex flex-col">
                <div className="text-center font-bold text-xs mb-1 uppercase text-gray-700">Chair<br/>Block-1</div>
                <div className="border border-gray-300 p-1 bg-gray-50">
                   {/* Header Row */}
                   <div className="flex justify-center border-b border-gray-300 mb-1 pb-1">
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">3</div>
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">2</div>
                      <div className="w-8 text-center text-[10px] font-bold text-gray-500 mx-0.5">1</div>
                   </div>
                   {Array.from({ length: totalRows }).map((_, r) => (
                     <div key={r} className="flex">
                       {renderSeat((r * 12) + 3)}
                       {renderSeat((r * 12) + 2)}
                       {renderSeat((r * 12) + 1)}
                     </div>
                   ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiningLayout;
