
import React from 'react';

const StarryBackground: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 bg-[#0b1026] overflow-hidden">
      <style>{`
        /* Shooting Stars Animation */
        @keyframes shooting-star-anim {
          0% { 
            transform: translateX(0) translateY(0) rotate(315deg) scale(0); 
            opacity: 1; 
          }
          10% {
             transform: translateX(-100px) translateY(100px) rotate(315deg) scale(1); 
          }
          20% { 
            transform: translateX(-200px) translateY(200px) rotate(315deg) scale(0); 
            opacity: 0; 
          }
          100% { 
            transform: translateX(-200px) translateY(200px) rotate(315deg) scale(0); 
            opacity: 0; 
          }
        }

        .shooting-star {
          position: absolute;
          left: 50%;
          top: 0%;
          height: 2px;
          width: 100px;
          background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,1), rgba(100, 200, 255, 1));
          border-radius: 999px;
          filter: drop-shadow(0 0 6px rgba(105, 198, 245, 1));
          animation: shooting-star-anim 4s ease-in-out infinite;
          opacity: 0;
          z-index: 2;
        }
        
        .shooting-star::before {
            content: '';
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            right: 0;
            height: 4px;
            width: 4px;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 0 10px #fff, 0 0 20px #0ff;
        }
      `}</style>
      
      {/* Background Image Layer - Tokyo Night */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
            // Tokyo Night: Neon, Rain, Cyberpunk vibes
            backgroundImage: "url('https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=2560&auto=format&fit=crop')",
            filter: 'brightness(0.6) contrast(1.1) saturate(1.2)', // Darkened for text readability
        }}
      >
        {/* Overlay to ensure text readability over city lights */}
        <div className="absolute inset-0 bg-black/40"></div>
        {/* Gradient for footer readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/90"></div>
      </div>

      {/* Shooting Stars */}
      <div className="shooting-star" style={{ top: '5%', left: '80%', animationDelay: '0s', animationDuration: '3s' }}></div>
      <div className="shooting-star" style={{ top: '15%', left: '50%', animationDelay: '1.5s', animationDuration: '4s' }}></div>
      <div className="shooting-star" style={{ top: '25%', left: '90%', animationDelay: '2.5s', animationDuration: '3.5s' }}></div>
      <div className="shooting-star" style={{ top: '10%', left: '30%', animationDelay: '4s', animationDuration: '5s' }}></div>
      {/* A big comet-like star */}
      <div className="shooting-star" style={{ top: '20%', left: '70%', animationDelay: '6s', animationDuration: '6s', width: '150px', height: '3px' }}></div>
    </div>
  );
};

export default StarryBackground;
