// Reusable byte.bit input component with rollover logic and auto toggle
import React, { useState, useEffect, useCallback } from 'react';
import { Link2, Link2Off } from 'lucide-react';

interface ByteBitInputProps {
  byteValue: number;
  bitValue: number;
  onChange: (byte: number, bit: number) => void;
  // Auto mode
  hasAuto?: boolean;
  isAuto?: boolean;
  onAutoChange?: (auto: boolean) => void;
  autoByteValue?: number;  // Value to show when auto is enabled
  autoBitValue?: number;
  // Styling
  disabled?: boolean;
  className?: string;
  label?: string;  // Optional label inside the input (e.g., "X" or "Y")
}

export function ByteBitInput({
  byteValue,
  bitValue,
  onChange,
  hasAuto = false,
  isAuto = false,
  onAutoChange,
  autoByteValue,
  autoBitValue,
  disabled = false,
  className = '',
  label,
}: ByteBitInputProps) {
  // Store the user's value internally when auto is enabled
  const [userByte, setUserByte] = useState(byteValue);
  const [userBit, setUserBit] = useState(bitValue);
  // Track which part is focused for the gradient fade effect
  const [focusedPart, setFocusedPart] = useState<'byte' | 'bit' | null>(null);

  // Update user values when props change (but not when auto is on)
  useEffect(() => {
    if (!isAuto) {
      setUserByte(byteValue);
      setUserBit(bitValue);
    }
  }, [byteValue, bitValue, isAuto]);

  // Display values: show auto values when auto is on, otherwise show actual values
  const displayByte = isAuto && autoByteValue !== undefined ? autoByteValue : byteValue;
  const displayBit = isAuto && autoBitValue !== undefined ? autoBitValue : bitValue;

  const handleByteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newByte = parseInt(e.target.value) || 0;
    setUserByte(newByte);
    onChange(newByte, bitValue);
  }, [bitValue, onChange]);

  const handleBitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let newBit = parseInt(e.target.value);
    if (isNaN(newBit)) newBit = 0;

    let newByte = byteValue;

    // Rollover logic
    if (newBit >= 8) {
      newByte += 1;
      newBit = 0;
    } else if (newBit < 0) {
      newByte = Math.max(0, newByte - 1);
      newBit = 7;
    }

    setUserByte(newByte);
    setUserBit(newBit);
    onChange(newByte, newBit);
  }, [byteValue, onChange]);

  const handleAutoToggle = useCallback(() => {
    if (!onAutoChange) return;

    if (isAuto) {
      // Switching from auto to manual: restore user's saved value
      onChange(userByte, userBit);
    }
    onAutoChange(!isAuto);
  }, [isAuto, onAutoChange, onChange, userByte, userBit]);

  const isDisabled = disabled || isAuto;

  return (
    <div className={`byte-bit-row ${className}`}>
      <div className={`byte-bit-input ${isDisabled ? 'disabled' : ''} ${label ? 'has-label' : ''}`}>
        {label && <span className="byte-bit-label">{label}</span>}
        <input
          type="number"
          className="byte-part"
          value={displayByte}
          onChange={handleByteChange}
          disabled={isDisabled}
          onFocus={() => setFocusedPart('byte')}
          onBlur={() => setFocusedPart(null)}
        />
        <span className={`byte-bit-sep ${focusedPart === 'byte' ? 'focused-byte' : ''} ${focusedPart === 'bit' ? 'focused-bit' : ''}`}>.</span>
        <input
          type="number"
          className="bit-part"
          value={displayBit}
          onChange={handleBitChange}
          disabled={isDisabled}
          min={-1}
          max={8}
          onFocus={() => setFocusedPart('bit')}
          onBlur={() => setFocusedPart(null)}
        />
      </div>
      {hasAuto && (
        <button
          className={`auto-toggle-btn ${isAuto ? 'linked' : ''}`}
          onClick={handleAutoToggle}
          title={isAuto ? 'Auto-calculated (click to set manually)' : 'Manual (click to auto-calculate)'}
          type="button"
        >
          {isAuto ? <Link2 size={14} /> : <Link2Off size={14} />}
        </button>
      )}
    </div>
  );
}
