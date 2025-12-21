import React from 'react';
import { X, ArrowRight } from 'lucide-react';

const DiningLayout = ({ gender, occupied, selected, onSelect, onClose }) => {
  // Configuration based on the Image (Total 12 seats per row)
  // Right Block (Chair-1): Seats 1, 2, 3
  // Middle Block (Floor): Seats 4, 5, 6, 7 (Block-1) | 8, 9 (Block-2)
  // Left Block (Chair-2): Seats 10, 11, 12
  
  // We generate enough rows for 200 seats (approx 17 rows)
  const TOTAL_SEATS = 200;
  const SEATS_PER_ROW = 12;
  const totalRows = Math.ceil(TOTAL_SEATS / SEATS_PER_ROW);

  const renderSeat = (seatNum, type) => {
    if (seatNum > TOTAL_SEATS) return <div className="w-8 h-8 m-0.5"></div>; // Empty placeholder

    const isOccupied = occupied.has(String(seatNum));
    const isSelected = String(selected) === String(seatNum);

    return (
      <button
        key={seatNum}
        type="button"
        disabled={isOccupied}
        onClick={() => onSelect(seatNum)}
        className={`
          w-8 h-8 m-0.5 text-xs font-bold border rounded flex items-center justify-center transition-colors
          ${isOccupied 
            ? 'bg-red-100 text-red-400 border-red-200 cursor-not-allowed' 
            : isSelected 
              ? 'bg-blue-600 text-white border-blue-700 shadow-md transform scale-110' 
              : 'bg-white hover:bg-green-50 border-gray-300 text-gray-700'}
        `}
        title={`${type} Seat ${seatNum}`}
      >
        {seatNum}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-100 p-4 border-b flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-blue-900 uppercase">{gender} Dining Layout</h2>
            <p className="text-sm text-gray-500">Select a seat (Gray = Available, Red = Occupied)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Layout Area */}
        <div className="overflow-auto p-6 bg-gray-50 flex-1 flex justify-center">
          <div className="relative bg-white border-2 border-dashed border-gray-300 p-8 shadow-inner inline-block">
            
            {/* Serving Table (Top) */}
            <div className="w-full bg-blue-600 text-white text-center py-3 font-bold mb-8 rounded shadow-sm tracking-widest uppercase">
              Serving Table
            </div>

            <div className="flex gap-4">
              
              {/* --- LEFT SECTION (CHAIR BLOCK-2) --- */}
              {/* Seats 12, 11, 10 */}
              <div className="flex flex-col items-center">
                <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Chair Block-2</div>
                {Array.from({ length: totalRows }).map((_, rowIndex) => {
                  const base = rowIndex * SEATS_PER_ROW;
                  return (
                    <div key={`L-${rowIndex}`} className="flex">
                      {renderSeat(base + 12, 'Chair')}
                      {renderSeat(base + 11, 'Chair')}
                      {renderSeat(base + 10, 'Chair')}
                    </div>
                  );
                })}
                {/* Visual Entrance Marker (Bottom Left of Block) */}
                <div className="mt-8 flex items-center bg-blue-500 text-white px-4 py-2 rounded shadow-lg animate-pulse">
                  <span className="font-bold mr-2">ENTRANCE</span>
                  <ArrowRight size={20} />
                </div>
              </div>

              {/* PATHWAY 1 */}
              <div className="w-12 bg-blue-200/50 flex items-center justify-center rounded border-x border-blue-200">
                <span className="text-blue-800/40 font-bold -rotate-90 tracking-[1em] whitespace-nowrap text-xs">PATHWAY</span>
              </div>

              {/* --- MIDDLE SECTION (FLOOR) --- */}
              {/* Seats 9,8 | 7,6,5,4 */}
              <div className="flex flex-col items-center">
                <div className="mb-2 text-xs font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-3 py-0.5 rounded border border-purple-100">Floor Area</div>
                <div className="flex gap-1">
                  {/* Floor Block-2 (9, 8) */}
                  <div className="flex flex-col">
                    {Array.from({ length: totalRows }).map((_, rowIndex) => {
                      const base = rowIndex * SEATS_PER_ROW;
                      return (
                        <div key={`M1-${rowIndex}`} className="flex">
                          {renderSeat(base + 9, 'Floor')}
                          {renderSeat(base + 8, 'Floor')}
                        </div>
                      );
                    })}
                  </div>

                  {/* Divider within Floor */}
                  <div className="w-px bg-gray-200 mx-0.5"></div>

                  {/* Floor Block-1 (7, 6, 5, 4) */}
                  <div className="flex flex-col">
                    {Array.from({ length: totalRows }).map((_, rowIndex) => {
                      const base = rowIndex * SEATS_PER_ROW;
                      return (
                        <div key={`M2-${rowIndex}`} className="flex">
                          {renderSeat(base + 7, 'Floor')}
                          {renderSeat(base + 6, 'Floor')}
                          {renderSeat(base + 5, 'Floor')}
                          {renderSeat(base + 4, 'Floor')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* PATHWAY 2 */}
              <div className="w-12 bg-blue-200/50 flex items-center justify-center rounded border-x border-blue-200">
                <span className="text-blue-800/40 font-bold -rotate-90 tracking-[1em] whitespace-nowrap text-xs">PATHWAY</span>
              </div>

              {/* --- RIGHT SECTION (CHAIR BLOCK-1) --- */}
              {/* Seats 3, 2, 1 */}
              <div className="flex flex-col items-center">
                <div className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Chair Block-1</div>
                {Array.from({ length: totalRows }).map((_, rowIndex) => {
                  const base = rowIndex * SEATS_PER_ROW;
                  return (
                    <div key={`R-${rowIndex}`} className="flex">
                      {renderSeat(base + 3, 'Chair')}
                      {renderSeat(base + 2, 'Chair')}
                      {renderSeat(base + 1, 'Chair')}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
        
        {/* Footer Legend */}
        <div className="p-4 bg-gray-50 border-t flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-gray-300 bg-white rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-red-200 bg-red-100 rounded"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-blue-700 bg-blue-600 rounded shadow"></div>
            <span>Selected</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DiningLayout;
