import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  isDark?: boolean;
}

/**
 * OTP Input Component - Reusable OTP input field with 6 digits
 * Features: Auto-focus between inputs, paste support, professional styling
 */
export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  isDark = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));

  // Update internal OTP state when value prop changes
  useEffect(() => {
    const newOtp = value.split('').slice(0, length);
    setOtp([...newOtp, ...Array(length - newOtp.length).fill('')]);
  }, [value, length]);

  /**
   * Handle input change and auto-focus next input
   */
  const handleChange = (index: number, val: string) => {
    if (disabled) return;

    // Only allow numbers
    const numericVal = val.replace(/[^0-9]/g, '');
    if (numericVal.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = numericVal;
    setOtp(newOtp);

    // Update parent component
    const otpString = newOtp.join('');
    onChange(otpString);

    // Auto-focus next input if digit entered
    if (numericVal && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete callback if all digits filled
    if (otpString.length === length) {
      onComplete?.(otpString);
    }
  };

  /**
   * Handle backspace key
   */
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handle paste event
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedData = e.clipboardData?.getData('text') || '';
    const pastedDigits = pastedData.replace(/[^0-9]/g, '').slice(0, length);

    if (pastedDigits) {
      const newOtp = pastedDigits.split('').slice(0, length);
      setOtp([...newOtp, ...Array(length - newOtp.length).fill('')]);
      onChange(pastedDigits);

      // Auto-focus last filled input
      setTimeout(() => {
        const focusIndex = Math.min(pastedDigits.length, length - 1);
        inputRefs.current[focusIndex]?.focus();
      }, 0);
    }

    e.preventDefault();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex justify-center gap-3"
    >
      {Array.from({ length }).map((_, index) => (
        <motion.input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          whileFocus={{ scale: 1.05 }}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          className={`w-12 h-12 md:w-14 md:h-14 text-center text-lg md:text-2xl font-bold rounded-lg border-2 transition-all ${
            isDark
              ? `bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600 focus:border-akai focus:shadow-lg focus:shadow-akai/50 ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`
              : `bg-white border-gray-300 text-ink placeholder-gray-400 focus:border-akai focus:shadow-lg focus:shadow-akai/30 ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`
          }`}
        />
      ))}
    </motion.div>
  );
};

export default OTPInput;
