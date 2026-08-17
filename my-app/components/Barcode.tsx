"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps {
  value: string;
  format?: "CODE128" | "CODE39" | "EAN13" | "EAN8" | "UPC";
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  lineColor?: string;
  className?: string;
  imageUrl?: string;
  useBackendImage?: boolean;
}

export default function Barcode({
  value,
  format = "CODE128",
  width = 2,
  height = 50,
  displayValue = true,
  fontSize = 12,
  lineColor = "#000000",
  className = "",
}: BarcodeProps) {
  const elementRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!elementRef.current || !value) {
      return;
    }

    try {
      setError(null);
      JsBarcode(elementRef.current, value, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        lineColor,
        margin: 5,
        background: "transparent",
      });
    } catch (err: any) {
      console.error("JsBarcode error:", err);
      setError(err?.message || "Invalid barcode format");
    }
  }, [value, format, width, height, displayValue, fontSize, lineColor]);

  if (!value) {
    return (
      <div className={`text-xs text-slate-400 italic bg-slate-50 border border-slate-200 rounded-lg p-2 text-center ${className}`}>
        No barcode number
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {error ? (
        <div className="text-xs text-red-500 bg-red-50 border border-red-200 p-2 rounded-lg text-center font-medium">
          Error: {error}
        </div>
      ) : (
        <svg ref={elementRef} className={`max-w-full h-auto ${className}`} />
      )}
    </div>
  );
}
