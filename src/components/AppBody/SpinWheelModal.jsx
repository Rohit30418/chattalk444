import React, { useState } from 'react';
import Swal from 'sweetalert2';

const PRIZES = [
  { label: '90% OFF', color: '#ec4899', value: '90' }, // Pink (Jackpot)
  { label: 'NO LUCK', color: '#64748b', value: '0' },  // Slate
  { label: '50% OFF', color: '#8b5cf6', value: '50' }, // Violet
  { label: 'TRY AGAIN', color: '#64748b', value: '0' },// Slate
  { label: '20% OFF', color: '#f59e0b', value: '20' }, // Amber
  { label: '70% OFF', color: '#10b981', value: '70' }, // Emerald
];

const SpinWheelModal = ({ onClose }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);

  const handleSpin = () => {
    if (spinning || hasSpun) return;

    setSpinning(true);
    
    // --- RIGGED LOGIC: Always land on index 0 (90% OFF) ---
    // The wheel has 6 segments. 360 / 6 = 60deg per segment.
    // 0deg is usually the top or right. Let's assume standard CSS rotation (0 is top).
    // To land on index 0, we need the wheel to stop where index 0 is at the pointer.
    // Let's add lots of spins (360 * 5) + specific random variance.
    
    const newRotation = rotation + 1800 + 360; // Spin at least 5-6 times
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      setHasSpun(true);
      fireConfetti();
    }, 4000); // Duration matches CSS transition
  };

  const fireConfetti = () => {
    // Simple SweetAlert success as a placeholder for confetti logic
    Swal.fire({
        title: 'JACKPOT! 🎉',
        text: 'You won 90% OFF Lifetime Plan!',
        icon: 'success',
        confirmButtonText: 'CLAIM NOW',
        confirmButtonColor: '#ec4899',
        background: '#151725',
        color: '#fff'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={hasSpun ? onClose : null} // Only close if done spinning
      ></div>

      {/* Main Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#151725] rounded-[3rem] p-8 text-center shadow-2xl animate-bounce-in border-4 border-white/10 overflow-hidden">
        
        {/* Header */}
        <div className="mb-8 relative z-10">
           <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 drop-shadow-sm mb-2">
             SPIN & WIN
           </h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
             Test your luck for an exclusive anniversary discount!
           </p>
        </div>

        {/* --- THE WHEEL --- */}
        <div className="relative w-72 h-72 mx-auto mb-8">
            
            {/* Pointer (Triangle) */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-yellow-400 drop-shadow-lg"></div>

            {/* Spinning Disc */}
            <div 
                className="w-full h-full rounded-full border-8 border-white dark:border-slate-800 shadow-[0_0_40px_rgba(236,72,153,0.3)] relative overflow-hidden transition-transform cubic-bezier(0.1, 0.7, 1.0, 0.1)"
                style={{ 
                    transform: `rotate(${rotation}deg)`,
                    transitionDuration: '4s',
                    transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' // Ease out cubic
                }}
            >
                {/* Segments - Using Conic Gradient for background */}
                <div className="w-full h-full rounded-full" 
                     style={{
                        background: `conic-gradient(
                            #ec4899 0deg 60deg, 
                            #334155 60deg 120deg, 
                            #8b5cf6 120deg 180deg, 
                            #475569 180deg 240deg, 
                            #f59e0b 240deg 300deg, 
                            #10b981 300deg 360deg
                        )`
                     }}
                ></div>

                {/* Text Labels (Absolute positioning based on rotation) */}
                {PRIZES.map((prize, i) => (
                    <div 
                        key={i}
                        className="absolute w-full top-0 left-0 h-full flex justify-center pt-4"
                        style={{ transform: `rotate(${i * 60 + 30}deg)` }} // +30 to center text in wedge
                    >
                        <span className="text-white font-black text-sm tracking-wider drop-shadow-md transform -rotate-90 origin-center mt-6">
                            {prize.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Center Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white dark:bg-[#151725] rounded-full flex items-center justify-center border-4 border-purple-500 shadow-xl z-10">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
            </div>
        </div>

        {/* Spin Button */}
        <button 
            onClick={handleSpin}
            disabled={spinning || hasSpun}
            className={`
                w-full py-4 rounded-2xl font-black text-xl shadow-xl transition-all relative overflow-hidden group
                ${hasSpun 
                    ? 'bg-gray-500 cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-[#FF0F7B] to-[#F89B29] hover:scale-[1.02] active:scale-[0.98]'
                }
                text-white
            `}
        >
             <span className="relative z-10 flex items-center justify-center gap-2">
               {spinning ? 'SPINNING...' : hasSpun ? 'CLAIM PRIZE' : 'SPIN NOW'} 
               {!spinning && !hasSpun && <i className="fa-solid fa-arrows-rotate text-sm"></i>}
             </span>
             
             {/* Shine Effect */}
             {!hasSpun && !spinning && (
                 <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shine"></div>
             )}
        </button>
        
        {!hasSpun && (
            <button onClick={onClose} className="mt-6 text-xs text-slate-400 font-bold hover:text-white underline decoration-slate-600 underline-offset-4">
                No thanks, I'll pay full price
            </button>
        )}
      </div>
    </div>
  );
};

export default SpinWheelModal;