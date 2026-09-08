import React from 'react';
import tarepetLogo from '@assets/tarepet__1784835204178.png';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  submessage,
  fullScreen = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-background/95 transition-all duration-300 ${
        fullScreen ? 'fixed inset-0 z-50 min-h-screen w-screen' : 'min-h-[50vh] w-full p-8'
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Centered Logo with Loading Circle Around It */}
        <div className="relative flex items-center justify-center">
          {/* Subtle ambient glow */}
          <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 blur-md animate-pulse" />
          
          {/* Outer spinning loading circle */}
          <div className="w-20 h-20 rounded-full border-[3px] border-emerald-500/20 border-t-emerald-600 animate-spin" />

          {/* Centered Logo */}
          <div className="absolute w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center p-1.5 overflow-hidden">
            <img
              src={tarepetLogo}
              alt="Tarepet Montessori"
              className="w-full h-full object-contain select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1">
          {message && (
            <p className="text-sm font-medium text-foreground/80 tracking-wide animate-pulse">
              {message}
            </p>
          )}
          {submessage && (
            <p className="text-xs text-muted-foreground">
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
