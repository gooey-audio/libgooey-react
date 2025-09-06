import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

export const Card = ({
  className = "",
  children,
  ...props
}: CardProps) => {
  return (
    <div
      className={`bg-black/20 border border-white/10 rounded-xl backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
