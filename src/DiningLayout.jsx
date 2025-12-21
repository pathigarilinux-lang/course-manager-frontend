import React from 'react';
import { X } from 'lucide-react';

const DiningLayout = ({ gender = 'Male', occupied = new Set(), selected, onSelect, onClose }) => {
  // --- CONFIGURATION ---
  const TOTAL_SEATS = 200; // Enough to cover the rows needed
  const SEATS_PER_ROW = 12; 
  const totalRows = 17; // Fixed to match the visual height in your screenshot

  // Logic: Male = 3|3|3|3, Female = 3|2|4|3 (Based on your Excel & Screenshot)
  const isFemale = gender === 'Female';
  
  const columns = [
    {
      title: "CHAIR (BLK-2)",
      colorClass: "text-orange-500",
      offsets: [11, 10, 9] // Represents 12, 11, 10 (0-indexed logic adjusted below)
    },
    {
      title: "FLOOR (BLK-2)",
      colorClass: "text-green-600",
      offsets: isFemale ? [8, 7] : [8, 7, 6] // Female: 9,8 | Male: 9,8,7
    },
    {
      title: "FLOOR (BLK-1)",
      colorClass: "text-green-600",
      offsets: isFemale ? [6, 5, 4, 3] : [5, 4, 3] // Female: 7,6,5,4 | Male: 6,5,4
    },
    {
      title: "CHAIR (BLK-1)",
      colorClass: "text-orange-500",
      offsets: [2, 1, 0] // Represents 3, 2, 1
    }
  ];

  // Helper to get the actual seat number based on row and offset
  // Row 0, Offset 0 (Seat 1) -> Actual displayed is 1
  // We calculate: (row * 12) + (offset + 1)
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
            ? 'bg-red-100 text-red-600 border-red-200 cursor-not-allowed' // Red for Occupied
            : isSelected 
              ? 'bg-blue-600 text-white border-blue-700 scale-110 z-10' // Blue for Selected
              : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400 hover:shadow-md'} // White for Available
        `}
      >
        {seatNum}
      </button>
    );
  };

  const Pathway = () => (
    <div className="w-10 bg-gray-400 flex items-center justify-center mx-1 rounded-sm shadow-inner self-stretch">
      <span className="text-white font-bold text-xs tracking-[0.3em] uppercase opacity-90" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        PATHWAY
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1000px] overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header - Matching Image Style */}
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-black">Select Dining Seat ({gender})</h2>
          <button 
            onClick={onClose} 
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded text-sm font-bold shadow transition-colors"
          >
            Close
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-auto p-8 bg-white flex-1 flex justify-center">
          <div className="inline-block min-w-max">
            
            {/* Blue Serving Table Bar */}
            <div className="bg-blue-500 text-white text-center py-4 font-bold text-lg rounded-sm mb-8 shadow-sm uppercase tracking-wide border border-blue-600">
              SERVING TABLE ({gender.toUpperCase()})
            </div>

            {/* The Grid Container */}
            <div className="flex items-start">
              
              {/* --- COLUMN 1 --- */}
              <div className="flex flex-col items-center">
                <div className={`font-bold mb-2 uppercase text-sm tracking-wide ${columns[0].colorClass}`}>
                  {columns[0].title}
                </div>
                {/* Header Row (First seats) */}
                <div className="flex mb-2 bg-orange-50 p-1 rounded border border-orange-100">
                  {columns[0].offsets.map(offset => (
                     <div key={offset} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs">
                       {getSeatNum(0, offset)}
                     </div>
                  ))}
                </div>
                {/* Seat Rows */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">
                    {columns[0].offsets.map(offset => renderSeat(getSeatNum(r, offset)))}
                  </div>
                ))}
              </div>

              <Pathway />

              {/* --- COLUMN 2 --- */}
              <div className="flex flex-col items-center">
                <div className={`font-bold mb-2 uppercase text-sm tracking-wide ${columns[1].colorClass}`}>
                  {columns[1].title}
                </div>
                {/* Header Row */}
                <div className="flex mb-2 bg-green-50 p-1 rounded border border-green-100">
                  {columns[1].offsets.map(offset => (
                     <div key={offset} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs">
                       {getSeatNum(0, offset)}
                     </div>
                  ))}
                </div>
                {/* Seat Rows */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">
                    {columns[1].offsets.map(offset => renderSeat(getSeatNum(r, offset)))}
                  </div>
                ))}
              </div>

              <Pathway />

              {/* --- COLUMN 3 --- */}
              <div className="flex flex-col items-center">
                <div className={`font-bold mb-2 uppercase text-sm tracking-wide ${columns[2].colorClass}`}>
                  {columns[2].title}
                </div>
                {/* Header Row */}
                <div className="flex mb-2 bg-green-50 p-1 rounded border border-green-100">
                  {columns[2].offsets.map(offset => (
                     <div key={offset} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs">
                       {getSeatNum(0, offset)}
                     </div>
                  ))}
                </div>
                {/* Seat Rows */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">
                    {columns[2].offsets.map(offset => renderSeat(getSeatNum(r, offset)))}
                  </div>
                ))}
              </div>

              <Pathway />

              {/* --- COLUMN 4 --- */}
              <div className="flex flex-col items-center relative">
                <div className={`font-bold mb-2 uppercase text-sm tracking-wide ${columns[3].colorClass}`}>
                  {columns[3].title}
                </div>
                {/* Header Row */}
                <div className="flex mb-2 bg-orange-50 p-1 rounded border border-orange-100">
                  {columns[3].offsets.map(offset => (
                     <div key={offset} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs">
                       {getSeatNum(0, offset)}
                     </div>
                  ))}
                </div>
                {/* Seat Rows */}
                {Array.from({ length: totalRows }).map((_, r) => (
                  <div key={r} className="flex">
                    {columns[3].offsets.map(offset => renderSeat(getSeatNum(r, offset)))}
                  </div>
                ))}

                {/* ENTRANCE LABEL (Bottom Right Overlay) */}
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
