// application/src/components/ui/SignaturePad.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Button } from './UIPrimitives';
import { PenTool, RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  clientName?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  clientName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI resolution
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio, ratio);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0F172A'; // dark ink
    ctx.lineWidth = 2.5;

    // If pre-existing value, draw image
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
      };
      img.src = value;
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange(undefined);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[#374151]">
        <span className="font-semibold flex items-center gap-1.5">
          <PenTool className="size-3.5 text-[#0274BB]" />
          Client Digital Signature {clientName ? `(${clientName})` : ''}
        </span>
        {hasDrawn && (
          <span className="text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
            <Check className="size-3" /> Signed &amp; Acknowledged
          </span>
        )}
      </div>

      <div className="relative border-2 border-dashed border-[#CBD5E1] rounded-md bg-[#F8FAFC] overflow-hidden group hover:border-[#0274BB] transition-colors">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-36 block cursor-crosshair touch-none bg-white"
        />

        {/* Guideline line */}
        <div className="absolute bottom-6 left-6 right-6 border-b border-[#E2E8F0] pointer-events-none flex justify-between text-[10px] text-[#94A3B8]">
          <span>✕ Sign above this line</span>
          <span>Digital Touch / Pen Capture</span>
        </div>

        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-[#94A3B8]">
            Draw signature using mouse, touchscreen or stylus
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-[11px] text-[#64748B]">
          Signed under metrology handover protocol (ISO/IEC 17025)
        </span>
        <Button
          type="button"
          variant="outlineInk"
          size="sm"
          onClick={handleClear}
          className="h-7 text-xs px-2 text-[#64748B] hover:text-[#0F172A]"
        >
          <RotateCcw className="size-3" /> Clear Signature
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
