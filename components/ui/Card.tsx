"use client";

import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-[28px] border border-white/60 bg-white/88 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
