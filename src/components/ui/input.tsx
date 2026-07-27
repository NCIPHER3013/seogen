import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-base text-slate-900 transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-[3px] focus-visible:ring-emerald-500/20 focus-visible:bg-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-[3px] aria-invalid:ring-red-500/20 md:text-sm hover:border-slate-300",
        className
      )}
      {...props}
    />
  )
}

export { Input }
