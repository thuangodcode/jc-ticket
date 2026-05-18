import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AuthFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder: string;
  icon: React.ReactNode;
  validation?: (value: string) => string | null;
  required?: boolean;
}

interface AuthFormProps {
  title: string;
  subtitle?: string;
  fields: AuthFormField[];
  submitLabel: string;
  isLoading?: boolean;
  error?: string;
  success?: string;
  onSubmit: (formData: Record<string, string>) => void;
  showPasswordToggle?: boolean;
}

/**
 * Reusable Auth Form Component
 * Handles form submission, validation, error/success messages
 */
export const AuthForm: React.FC<AuthFormProps> = ({
  title,
  subtitle,
  fields,
  submitLabel,
  isLoading = false,
  error,
  success,
  onSubmit,
  showPasswordToggle = false,
}) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  );
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /**
   * Handle input change with real-time validation
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Real-time validation
    const field = fields.find((f) => f.name === name);
    if (field?.validation) {
      const error = field.validation(value);
      if (error) {
        setFieldErrors((prev) => ({ ...prev, [name]: error }));
      }
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        errors[field.name] = `${field.label} is required`;
      }
      if (field.validation && formData[field.name]) {
        const error = field.validation(formData[field.name]);
        if (error) {
          errors[field.name] = error;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    onSubmit(formData);
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Title and Subtitle */}
      <div className="text-center mb-8">
        <h2 className={`text-3xl md:text-4xl font-bold font-elegant mb-2 ${
          isDark ? 'text-white' : 'text-ink'
        }`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`${isDark ? 'text-zinc-400' : 'text-charcoal/70'}`}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-4 rounded-lg flex items-start gap-3 ${
            isDark
              ? 'bg-red-900/20 border border-red-700'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <AlertCircle size={20} className={isDark ? 'text-red-400' : 'text-red-600'} />
          <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</p>
        </motion.div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`p-4 rounded-lg flex items-start gap-3 ${
            isDark
              ? 'bg-green-900/20 border border-green-700'
              : 'bg-green-50 border border-green-200'
          }`}
        >
          <CheckCircle size={20} className={isDark ? 'text-green-400' : 'text-green-600'} />
          <p className={isDark ? 'text-green-300' : 'text-green-700'}>{success}</p>
        </motion.div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <motion.div
            key={field.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <label className={`block text-sm font-semibold mb-2 ${
              isDark ? 'text-zinc-300' : 'text-charcoal'
            }`}>
              {field.label}
            </label>

            <div className="relative">
              {/* Input Icon */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-akai">
                {field.icon}
              </div>

              {/* Input Field */}
              <input
                type={
                  field.type === 'password' && showPasswordToggle
                    ? showPasswords[field.name]
                      ? 'text'
                      : 'password'
                    : field.type
                }
                name={field.name}
                placeholder={field.placeholder}
                value={formData[field.name]}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 focus:outline-none transition-all ${
                  fieldErrors[field.name]
                    ? isDark
                      ? 'border-red-600 bg-red-900/10'
                      : 'border-red-400 bg-red-50'
                    : isDark
                      ? 'border-zinc-700 bg-zinc-800 text-white placeholder-zinc-600 focus:border-akai focus:shadow-lg focus:shadow-akai/30'
                      : 'border-gray-300 bg-white text-ink placeholder-gray-400 focus:border-akai focus:shadow-lg focus:shadow-akai/20'
                }`}
              />

              {/* Password Toggle Button */}
              {field.type === 'password' && showPasswordToggle && (
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(field.name)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-akai hover:text-sakura-dark transition-colors"
                >
                  {showPasswords[field.name] ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              )}
            </div>

            {/* Field Error */}
            {fieldErrors[field.name] && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-sm mt-1 flex items-center gap-1 ${
                  isDark ? 'text-red-400' : 'text-red-600'
                }`}
              >
                <AlertCircle size={14} />
                {fieldErrors[field.name]}
              </motion.p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.98 } : {}}
        className="w-full py-3 bg-akai text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-akai/50 hover:shadow-xl hover:shadow-akai/70"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          submitLabel
        )}
      </motion.button>
    </motion.form>
  );
};

export default AuthForm;
