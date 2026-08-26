import React, { useRef, useEffect } from "react";

/** Inline Noise overlay (no external imports). */
interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number; // 0–255
}

export const Noise: React.FC<NoiseProps> = ({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 8,
}) => {
  const grainRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frame = 0;
    let animationId = 0;
    const canvasSize = 128;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize);
      const data = imageData.data;
      const len = data.length;
      for (let i = 0; i < len; i += 4) {
        const val = (Math.random() * 255) | 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = patternAlpha;
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const loop = () => {
      if (frame % patternRefreshInterval === 0) drawGrain();
      frame++;
      animationId = window.requestAnimationFrame(loop);
    };

    window.addEventListener("resize", resize);
    resize();
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationId);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha]);

  return (
    <canvas
      ref={grainRef}
      className="pointer-events-none absolute inset-0 w-full h-full opacity-30 -z-10"
      style={{ imageRendering: "pixelated" }}
    />
  );
};

/** Gradient + Noise customized for Tare Pet Montessori School brand palette. */
export default function Component({
  variant = "dark",
}: {
  variant?: "dark" | "brand" | "light";
}) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {variant === "dark" && (
        <div className="absolute inset-0 bg-[#0d1610]">
          {/* Brand Crimson Spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_650px_at_50%_200px,rgba(196,30,58,0.30),transparent)]" />
          {/* Brand Forest Green Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_550px_at_80%_600px,rgba(45,122,70,0.25),transparent)]" />
        </div>
      )}

      {variant === "brand" && (
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 bg-[radial-gradient(circle_700px_at_50%_0px,rgba(196,30,58,0.07),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_85%_75%,rgba(45,122,70,0.06),transparent)]" />
        </div>
      )}

      {variant === "light" && (
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(196,30,58,0.05),transparent)]" />
        </div>
      )}

      {/* Grain overlay */}
      <Noise patternRefreshInterval={2} patternAlpha={8} />
    </div>
  );
}
