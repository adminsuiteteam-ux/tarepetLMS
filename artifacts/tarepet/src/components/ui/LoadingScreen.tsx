import React from 'react';
import preloadLogoWebp from '@assets/preload-logo.webp';
import preloadLogoPng from '@assets/preload-logo.png';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading Tarepet...',
  submessage,
  fullScreen = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-background/95 backdrop-blur-xs transition-all duration-300 ${
        fullScreen ? 'fixed inset-0 z-50 min-h-screen w-screen' : 'min-h-[50vh] w-full p-8'
      }`}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Centered Logo with Spinning Accent Ring */}
        <div className="relative flex items-center justify-center">
          {/* Subtle ambient glow */}
          <div className="absolute w-24 h-24 rounded-full bg-emerald-500/15 blur-md animate-pulse" />
          
          {/* Outer spinning loading circle */}
          <div className="w-20 h-20 rounded-full border-[3px] border-emerald-500/20 border-t-emerald-600 animate-spin" />

          {/* Centered Ultra-Lightweight Logo (< 7KB) */}
          <div className="absolute w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center p-1 overflow-hidden ring-1 ring-emerald-100">
            <picture className="w-full h-full flex items-center justify-center">
              <source srcSet={preloadLogoWebp} type="image/webp" />
              <img
                src={preloadLogoPng}
                alt="Tarepet Logo"
                width={48}
                height={48}
                loading="eager"
                decoding="async"
                className="w-full h-full object-contain select-none pointer-events-none"
              />
            </picture>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1.5 text-center px-4">
          {message && (
            <p className="text-sm font-semibold text-foreground/90 tracking-wide animate-pulse">
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
