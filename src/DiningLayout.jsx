import React from 'react';
import { X } from 'lucide-react';

const DiningLayout = ({ gender = 'Male', occupied = new Set(), selected, onSelect, onClose }) => {
  // Configuration
  const TOTAL_SEATS = 200;
  const SEATS_PER_ROW = 12;
  const totalRows = Math.ceil(TOTAL_SEATS / SEATS_PER_ROW);

  // Define Layout Splits based on Gender
  // Male (Screenshot): 3 | 3 | 3 | 3
  // Female (Excel):    3 | 2 | 4 | 3
  const config = gender === 'Female' 
    ? {
        col1: [12, 11, 10],      // Chair Block-2
        col2: [9, 8],            // Floor Block-2
        col3: [7, 6, 5, 4],      // Floor Block-1
        col4: [3, 2, 1]          // Chair Block-1
      }
    : {
        col1: [12, 11, 10],      // Chair Block-2
        col2: [9, 8, 7],         // Floor Block-2
        col3: [6, 5, 4],         // Floor Block-1
        col4: [3, 2, 1]          // Chair Block-1
      };

  const renderSeat = (baseNum, offset) => {
    const seatNum = baseNum + offset;
    if (seatNum > TOTAL_SEATS) return <div key={offset} className="w-8 h-8 m-1"></div>;

    const isOccupied = occupied.has(String(seatNum));
    const isSelected = String(selected) === String(seatNum);

    return (
      <button
        key={seatNum}
        onClick={() => !isOccupied && onSelect(seatNum)}
        disabled={isOccupied}
        className={`
          w-8 h-8 m-1 flex items-center justify-center text-xs font-bold rounded shadow-sm border transition-all
          ${isOccupied 
            ? 'bg-red-100 text-red-600 border-red-200 cursor-not-allowed' 
            : isSelected 
              ? 'bg-blue-600 text-white border-blue-700 scale-110 z-10' 
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:shadow-md'}
        `}
      >
        {seatNum}
      </button>
    );
  };

  // The Vertical Pathway Bar
  const Pathway = () => (
    <div className="w-10 bg-gray-300 flex items-center justify-center mx-2 rounded shadow-inner">
      <span className="text-white font-bold text-xs tracking-[0.3em] uppercase opacity-70" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        PATHWAY
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1100px] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Select Dining Seat ({gender})</h2>
          <button 
            onClick={onClose} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow text-sm font-bold transition-colors"
          >
            Close
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-auto p-6 bg-gray-100 flex-1">
          <div className="bg-white p-6 rounded shadow-lg border border-gray-200 inline-block min-w-max">
            
            {/* Blue Serving Table Bar */}
            <div className="bg-blue-500 text-white text-center py-3 font-bold text-lg rounded mb-6 shadow-md uppercase tracking-wider">
              SERVING TABLE ({gender.toUpperCase()})
            </div>

            <div className="flex">
              
              {/* --- COL 1: CHAIR BLOCK-2 --- */}
              <div className="flex flex-col items-center">
                <div className="text-orange-500 font-bold mb-2 uppercase text-sm tracking-wide">CHAIR (BLK-2)</div>
                {/* Header Row */}
                <div className="flex mb-2 border-b-2 border-orange-100 pb-1">
                  {config.col1.map(n => (
                     <div key={n} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-400 bg-orange-50 rounded text-xs">{n}</div>
                  ))}
                </div>
                {/* Seats */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">
                    {config.col1.map(offset => renderSeat(r * 12, offset))}
                  </div>
                ))}
              </div>

              <Pathway />

              {/* --- COL 2: FLOOR BLOCK-2 --- */}
              <div className="flex flex-col items-center">
                <div className="text-green-600 font-bold mb-2 uppercase text-sm tracking-wide">FLOOR (BLK-2)</div>
                {/* Header Row */}
                <div className="flex mb-2 border-b-2 border-green-100 pb-1">
                  {config.col2.map(n => (
                     <div key={n} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-400 bg-green-50 rounded text-xs">{n}</div>
                  ))}
                </div>
                {/* Seats */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">
                    {config.col2.map(offset => renderSeat(r * 12, offset))}
                  </div>
                ))}
              </div>

              <Pathway />

              {/* --- COL 3: FLOOR BLOCK-1 --- */}
              <div className="flex flex-col items-center">
                <div className="text-green-600 font-bold mb-2 uppercase text-sm tracking-wide">FLOOR (BLK-1)</div>
                {/* Header Row */}
                <div className="flex mb-2 border-b-2 border-green-100 pb-1">
                  {config.col3.map(n => (
                     <div key={n} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-400 bg-green-50 rounded text-xs">{n}</div>
                  ))}
                </div>
                {/* Seats */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">
                     {config.col3.map(offset => renderSeat(r * 12, offset))}
                  </div>
                ))}
              </div>

              <Pathway />

              {/* --- COL 4: CHAIR BLOCK-1 --- */}
              <div className="flex flex-col items-center relative">
                <div className="text-orange-500 font-bold mb-2 uppercase text-sm tracking-wide">CHAIR (BLK-1)</div>
                {/* Header Row */}
                <div className="flex mb-2 border-b-2 border-orange-100 pb-1">
                  {config.col4.map(n => (
                     <div key={n} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-400 bg-orange-50 rounded text-xs">{n}</div>
                  ))}
                </div>
                {/* Seats */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">
                    {config.col4.map(offset => renderSeat(r * 12, offset))}
                  </div>
                ))}

                {/* ENTRANCE BUTTON (Absolute Bottom Right) */}
                <div className="absolute -bottom-10 right-0">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow">
                        ENTRANCE
                    </div>
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
