"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={[
              "w-full bg-white border border-[rgba(0,0,0,0.1)] rounded-xl text-foreground",
              "placeholder:text-gray-400 transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "",
              leftIcon ? "pl-10" : "px-4",
              rightElement ? "pr-12" : "px-4",
              "py-3 text-sm",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3">{rightElement}</div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
