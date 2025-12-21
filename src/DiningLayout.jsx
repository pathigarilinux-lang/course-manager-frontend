import React from 'react';
import { X } from 'lucide-react';

const DiningLayout = ({ gender = 'Male', occupied = new Set(), selected, onSelect, onClose }) => {
  // --- CONFIGURATION ---
  const TOTAL_SEATS = 200; 
  const totalRows = 17; // Matches the height in your screenshot

  // --- LOGIC SWITCH ---
  // Male (Screenshot):    3 | 3 | 3 | 3 (Standard)
  // Female (Excel):       3 | 2 | 4 | 3 (Specific Requirement)
  const isFemale = gender === 'Female';

  const columns = [
    {
      title: "CHAIR (BLK-2)",
      headerColor: "text-orange-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
      // Male: 12,11,10 | Female: 12,11,10
      offsets: [11, 10, 9] 
    },
    {
      title: "FLOOR (BLK-2)",
      headerColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
      // Male: 9,8,7 | Female: 9,8
      offsets: isFemale ? [8, 7] : [8, 7, 6]
    },
    {
      title: "FLOOR (BLK-1)",
      headerColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
      // Male: 6,5,4 | Female: 7,6,5,4
      offsets: isFemale ? [6, 5, 4, 3] : [5, 4, 3]
    },
    {
      title: "CHAIR (BLK-1)",
      headerColor: "text-orange-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
      // Male: 3,2,1 | Female: 3,2,1
      offsets: [2, 1, 0]
    }
  ];

  // Helper: Calculates Seat Number (Row * 12 + Offset + 1)
  const getSeatNum = (r, offset) => (r * 12) + (offset + 1);

  const renderSeat = (seatNum) => {
    if (seatNum > TOTAL_SEATS) return <div key={seatNum} className="w-8 h-8 m-1"></div>;

    const isOccupied = occupied.has(String(seatNum));
    const isSelected = String(selected) === String(seatNum);

    return (
      <button
        key={seatNum}
        type="button"
        disabled={isOccupied}
        onClick={() => onSelect(seatNum)}
        className={`
          w-8 h-8 m-1 flex items-center justify-center text-xs font-bold rounded shadow-sm border transition-all
          ${isOccupied 
            ? 'bg-red-100 text-red-600 border-red-200 cursor-not-allowed' 
            : isSelected 
              ? 'bg-blue-600 text-white border-blue-700 scale-110 z-10' 
              : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400 hover:shadow-md'}
        `}
      >
        {seatNum}
      </button>
    );
  };

  const Pathway = () => (
    <div className="w-12 bg-gray-300/80 flex items-center justify-center mx-2 rounded shadow-inner self-stretch border border-gray-300">
      <span className="text-white font-bold text-xs tracking-[0.3em] uppercase opacity-100 drop-shadow-sm" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        PATHWAY
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1200px] overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-black">Select Dining Seat ({gender})</h2>
          <button 
            onClick={onClose} 
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded text-sm font-bold shadow transition-colors"
          >
            Close
          </button>
        </div>

        {/* Layout Container */}
        <div className="overflow-auto p-8 bg-white flex-1 flex justify-center">
          <div className="inline-block min-w-max">
            
            {/* Blue Serving Table Bar */}
            <div className="bg-blue-500 text-white text-center py-4 font-bold text-lg rounded-sm mb-8 shadow-sm uppercase tracking-wide border border-blue-600">
              SERVING TABLE ({gender.toUpperCase()})
            </div>

            {/* The Grid */}
            <div className="flex items-start">
              
              {/* --- COLUMN 1 (CHAIR BLK-2) --- */}
              <div className="flex flex-col items-center">
                <div className={`font-bold mb-2 uppercase text-sm tracking-wide ${columns[0].headerColor}`}>{columns[0].title}</div>
                {/* Header Row */}
                <div className={`flex mb-2 p-1 rounded border ${columns[0].bgColor} ${columns[0].borderColor}`}>
                  {columns[0].offsets.map(off => (
                     <div key={off} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{getSeatNum(0, off)}</div>
                  ))}
                </div>
                {/* Seats */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">{columns[0].offsets.map(off => renderSeat(getSeatNum(r, off)))}</div>
                ))}
              </div>

              <Pathway />

              {/* --- COLUMN 2 (FLOOR BLK-2) --- */}
              <div className="flex flex-col items-center">
                <div className={`font-bold mb-2 uppercase text-sm tracking-wide ${columns[1].headerColor}`}>{columns[1].title}</div>
                {/* Header Row */}
                <div className={`flex mb-2 p-1 rounded border ${columns[1].bgColor} ${columns[1].borderColor}`}>
                  {columns[1].offsets.map(off => (
                     <div key={off} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{getSeatNum(0, off)}</div>
                  ))}
                </div>
                {/* Seats */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">{columns[1].offsets.map(off => renderSeat(getSeatNum(r, off)))}</div>
                ))}
              </div>

              <Pathway />

              {/* --- COLUMN 3 (FLOOR BLK-1) --- */}
              <div className="flex flex-col items-center">
                <div className={`font-bold mb-2 uppercase text-sm tracking-wide ${columns[2].headerColor}`}>{columns[2].title}</div>
                {/* Header Row */}
                <div className={`flex mb-2 p-1 rounded border ${columns[2].bgColor} ${columns[2].borderColor}`}>
                  {columns[2].offsets.map(off => (
                     <div key={off} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{getSeatNum(0, off)}</div>
                  ))}
                </div>
                {/* Seats */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">{columns[2].offsets.map(off => renderSeat(getSeatNum(r, off)))}</div>
                ))}
              </div>

              <Pathway />

              {/* --- COLUMN 4 (CHAIR BLK-1) --- */}
              <div className="flex flex-col items-center relative">
                <div className={`font-bold mb-2 uppercase text-sm tracking-wide ${columns[3].headerColor}`}>{columns[3].title}</div>
                {/* Header Row */}
                <div className={`flex mb-2 p-1 rounded border ${columns[3].bgColor} ${columns[3].borderColor}`}>
                  {columns[3].offsets.map(off => (
                     <div key={off} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{getSeatNum(0, off)}</div>
                  ))}
                </div>
                {/* Seats */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">{columns[3].offsets.map(off => renderSeat(getSeatNum(r, off)))}</div>
                ))}

                {/* ENTRANCE BUTTON (Overlay) */}
                <div className="absolute -bottom-10 right-0">
                    <div className="bg-blue-500 text-white px-5 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-md">
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
