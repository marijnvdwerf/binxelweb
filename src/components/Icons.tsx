// Custom icons for byte and bit fields
import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

// Byte icon: 3x3 grid without center dot (based on Lucide grip)
export function ByteIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* Top row */}
      <circle cx="6" cy="6" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      {/* Middle row - no center */}
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
      {/* Bottom row */}
      <circle cx="6" cy="18" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

// Bit icon: Just the center dot
export function BitIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
