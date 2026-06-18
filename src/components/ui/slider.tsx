import * as React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> & {
    value?: number[];
    defaultValue?: number[];
    onValueChange?: (value: number[]) => void;
  }
>(({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
  const val = Array.isArray(value) ? value[0] : value;
  const defVal = Array.isArray(defaultValue) ? defaultValue[0] : defaultValue;
  
  const currentVal = val !== undefined ? val : (defVal !== undefined ? defVal : Number(min));
  const percentage = Math.max(0, Math.min(100, ((currentVal - Number(min)) / (Number(max) - Number(min))) * 100));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (onValueChange) {
      onValueChange([newValue]);
    }
  };

  return (
    <div className={cn("relative flex w-full items-center touch-none py-3 group", className)}>
      <style>
        {`
          .native-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #ffffff;
            border: 2px solid #9333ea;
            border-radius: 50%;
            cursor: grab;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: all 0.15s ease-in-out;
          }
          .native-slider::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            background: #f8fafc;
          }
          .native-slider:active::-webkit-slider-thumb {
            cursor: grabbing;
            transform: scale(1.1);
          }
          .native-slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #ffffff;
            border: 2px solid #9333ea;
            border-radius: 50%;
            cursor: grab;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: all 0.15s ease-in-out;
          }
          .native-slider::-moz-range-thumb:hover {
            transform: scale(1.1);
            background: #f8fafc;
          }
          .native-slider:active::-moz-range-thumb {
            cursor: grabbing;
            transform: scale(1.1);
          }
        `}
      </style>
      <input
        type="range"
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={currentVal}
        onChange={handleChange}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 native-slider"
        {...props}
        style={{
          background: `linear-gradient(to right, #9333ea 0%, #9333ea ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`
        }}
      />
    </div>
  )
})

Slider.displayName = "Slider"
export { Slider }

