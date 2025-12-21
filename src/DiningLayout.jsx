import React from 'react';
import { X } from 'lucide-react';

// ==========================================
// 1. SHARED UI ELEMENTS (Visuals Only)
// ==========================================
const TOTAL_SEATS = 200;
const SEATS_PER_ROW = 12;
const TOTAL_ROWS = 17;

const SeatButton = ({ seatNum, status, onSelect }) => {
  if (seatNum > TOTAL_SEATS) return <div className="w-8 h-8 m-1"></div>;
  
  const isOccupied = status === 'occupied';
  const isSelected = status === 'selected';

  return (
    <button
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

// Helper to calculate seat numbers row-by-row
const getSeat = (r, offset) => (r * 12) + (offset + 1);

// ==========================================
// 2. MALE LAYOUT (3 | 3 | 3 | 3)
// ==========================================
const MaleDining = ({ occupied, selected, onSelect }) => {
  // Male Specific Column Offsets
  const col1 = [11, 10, 9]; // 12, 11, 10
  const col2 = [8, 7, 6];   // 9, 8, 7
  const col3 = [5, 4, 3];   // 6, 5, 4
  const col4 = [2, 1, 0];   // 3, 2, 1

  return (
    <div className="flex items-start">
      {/* COLUMN 1: Chair 2 */}
      <div className="flex flex-col items-center">
        <div className="text-orange-500 font-bold mb-2 uppercase text-sm tracking-wide">CHAIR (BLK-2)</div>
        <div className="flex mb-2 bg-orange-50 p-1 rounded border border-orange-100">
          {col1.map(o => <div key={o} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{o + 1}</div>)}
        </div>
        {Array.from({ length: TOTAL_ROWS }).map((_, r) => (
          <div key={r} className="flex">
            {col1.map(o => <SeatButton key={o} seatNum={getSeat(r, o)} status={occupied.has(String(getSeat(r,o))) ? 'occupied' : String(selected)===String(getSeat(r,o)) ? 'selected' : 'free'} onSelect={onSelect} />)}
          </div>
        ))}
      </div>

      <Pathway />

      {/* COLUMN 2: Floor 2 */}
      <div className="flex flex-col items-center">
        <div className="text-green-600 font-bold mb-2 uppercase text-sm tracking-wide">FLOOR (BLK-2)</div>
        <div className="flex mb-2 bg-green-50 p-1 rounded border border-green-100">
          {col2.map(o => <div key={o} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{o + 1}</div>)}
        </div>
        {Array.from({ length: TOTAL_ROWS }).map((_, r) => (
          <div key={r} className="flex">
            {col2.map(o => <SeatButton key={o} seatNum={getSeat(r, o)} status={occupied.has(String(getSeat(r,o))) ? 'occupied' : String(selected)===String(getSeat(r,o)) ? 'selected' : 'free'} onSelect={onSelect} />)}
          </div>
        ))}
      </div>

      <Pathway />

      {/* COLUMN 3: Floor 1 */}
      <div className="flex flex-col items-center">
        <div className="text-green-600 font-bold mb-2 uppercase text-sm tracking-wide">FLOOR (BLK-1)</div>
        <div className="flex mb-2 bg-green-50 p-1 rounded border border-green-100">
          {col3.map(o => <div key={o} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{o + 1}</div>)}
        </div>
        {Array.from({ length: TOTAL_ROWS }).map((_, r) => (
          <div key={r} className="flex">
            {col3.map(o => <SeatButton key={o} seatNum={getSeat(r, o)} status={occupied.has(String(getSeat(r,o))) ? 'occupied' : String(selected)===String(getSeat(r,o)) ? 'selected' : 'free'} onSelect={onSelect} />)}
          </div>
        ))}
      </div>

      <Pathway />

      {/* COLUMN 4: Chair 1 */}
      <div className="flex flex-col items-center relative">
        <div className="text-orange-500 font-bold mb-2 uppercase text-sm tracking-wide">CHAIR (BLK-1)</div>
        <div className="flex mb-2 bg-orange-50 p-1 rounded border border-orange-100">
          {col4.map(o => <div key={o} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{o + 1}</div>)}
        </div>
        {Array.from({ length: TOTAL_ROWS }).map((_, r) => (
          <div key={r} className="flex">
            {col4.map(o => <SeatButton key={o} seatNum={getSeat(r, o)} status={occupied.has(String(getSeat(r,o))) ? 'occupied' : String(selected)===String(getSeat(r,o)) ? 'selected' : 'free'} onSelect={onSelect} />)}
          </div>
        ))}
        {/* Entrance Button */}
        <div className="absolute -bottom-10 right-0">
            <div className="bg-blue-500 text-white px-5 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-md">ENTRANCE</div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. FEMALE LAYOUT (3 | 2 | 4 | 3)
// ==========================================
const FemaleDining = ({ occupied, selected, onSelect }) => {
  // Female Specific Column Offsets (Per Excel Image)
  const col1 = [11, 10, 9];    // 12, 11, 10 (Chair)
  const col2 = [8, 7];         // 9, 8       (Floor) - NARROWER
  const col3 = [6, 5, 4, 3];   // 7, 6, 5, 4 (Floor) - WIDER
  const col4 = [2, 1, 0];      // 3, 2, 1    (Chair)

  return (
    <div className="flex items-start">
      {/* COLUMN 1: Chair 2 */}
      <div className="flex flex-col items-center">
        <div className="text-orange-500 font-bold mb-2 uppercase text-sm tracking-wide">CHAIR (BLK-2)</div>
        <div className="flex mb-2 bg-orange-50 p-1 rounded border border-orange-100">
          {col1.map(o => <div key={o} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{o + 1}</div>)}
        </div>
        {Array.from({ length: TOTAL_ROWS }).map((_, r) => (
          <div key={r} className="flex">
            {col1.map(o => <SeatButton key={o} seatNum={getSeat(r, o)} status={occupied.has(String(getSeat(r,o))) ? 'occupied' : String(selected)===String(getSeat(r,o)) ? 'selected' : 'free'} onSelect={onSelect} />)}
          </div>
        ))}
      </div>

      <Pathway />

      {/* COLUMN 2: Floor 2 (Only 2 seats wide) */}
      <div className="flex flex-col items-center">
        <div className="text-green-600 font-bold mb-2 uppercase text-sm tracking-wide">FLOOR (BLK-2)</div>
        <div className="flex mb-2 bg-green-50 p-1 rounded border border-green-100">
          {col2.map(o => <div key={o} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{o + 1}</div>)}
        </div>
        {Array.from({ length: TOTAL_ROWS }).map((_, r) => (
          <div key={r} className="flex">
            {col2.map(o => <SeatButton key={o} seatNum={getSeat(r, o)} status={occupied.has(String(getSeat(r,o))) ? 'occupied' : String(selected)===String(getSeat(r,o)) ? 'selected' : 'free'} onSelect={onSelect} />)}
          </div>
        ))}
      </div>

      <Pathway />

      {/* COLUMN 3: Floor 1 (4 seats wide) */}
      <div className="flex flex-col items-center">
        <div className="text-green-600 font-bold mb-2 uppercase text-sm tracking-wide">FLOOR (BLK-1)</div>
        <div className="flex mb-2 bg-green-50 p-1 rounded border border-green-100">
          {col3.map(o => <div key={o} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{o + 1}</div>)}
        </div>
        {Array.from({ length: TOTAL_ROWS }).map((_, r) => (
          <div key={r} className="flex">
            {col3.map(o => <SeatButton key={o} seatNum={getSeat(r, o)} status={occupied.has(String(getSeat(r,o))) ? 'occupied' : String(selected)===String(getSeat(r,o)) ? 'selected' : 'free'} onSelect={onSelect} />)}
          </div>
        ))}
      </div>

      <Pathway />

      {/* COLUMN 4: Chair 1 */}
      <div className="flex flex-col items-center relative">
        <div className="text-orange-500 font-bold mb-2 uppercase text-sm tracking-wide">CHAIR (BLK-1)</div>
        <div className="flex mb-2 bg-orange-50 p-1 rounded border border-orange-100">
          {col4.map(o => <div key={o} className="w-8 h-8 m-1 flex items-center justify-center font-bold text-gray-800 text-xs bg-white/50 rounded">{o + 1}</div>)}
        </div>
        {Array.from({ length: TOTAL_ROWS }).map((_, r) => (
          <div key={r} className="flex">
            {col4.map(o => <SeatButton key={o} seatNum={getSeat(r, o)} status={occupied.has(String(getSeat(r,o))) ? 'occupied' : String(selected)===String(getSeat(r,o)) ? 'selected' : 'free'} onSelect={onSelect} />)}
          </div>
        ))}
        {/* Entrance Button */}
        <div className="absolute -bottom-10 right-0">
            <div className="bg-blue-500 text-white px-5 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-md">ENTRANCE</div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN EXPORT (SWITCHER ONLY)
// ==========================================
const DiningLayout = ({ gender = 'Male', occupied, selected, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[2000] backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[1200px] overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-black">Select Dining Seat ({gender})</h2>
          <button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded text-sm font-bold shadow transition-colors">Close</button>
        </div>

        {/* Content */}
        <div className="overflow-auto p-8 bg-white flex-1 flex justify-center">
          <div className="inline-block min-w-max">
            <div className="bg-blue-500 text-white text-center py-4 font-bold text-lg rounded-sm mb-8 shadow-sm uppercase tracking-wide border border-blue-600">
              SERVING TABLE ({gender.toUpperCase()})
            </div>

            {/* STRICTLY SEPARATE RENDERING */}
            {gender === 'Female' ? (
              <FemaleDining occupied={occupied} selected={selected} onSelect={onSelect} />
            ) : (
              <MaleDining occupied={occupied} selected={selected} onSelect={onSelect} />
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default DiningLayout;
