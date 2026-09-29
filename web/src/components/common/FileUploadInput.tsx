import toast from 'react-hot-toast';
import { SafeImage } from './SafeImage';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Camera, FileText } from 'lucide-react';

export interface FileUploadInputProps {
  label?: string;
  name: string;
  value?: File | string | null;
  onChange: (value: File | string | null) => void;
  variant?: 'default' | 'avatar';
  fallbackText?: string;
  accept?: string;
  allowedExtensions?: string[];
  maxSizeMB?: number;
  category?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
  label,
  name,
  value,
  onChange,
  variant = 'default',
  fallbackText = 'VT',
  accept = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml',
  allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
  maxSizeMB = 5,
  placeholder = 'Click or drag file to select',
  error: externalError,
  disabled = false,
  className = '',
}) => {
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate object URL for raw File preview
  const previewUrl = useMemo(() => {
    if (value instanceof File) {
      return URL.createObjectURL(value);
    }
    if (typeof value === 'string') {
      return value;
    }
    return null;
  }, [value]);

  // Clean up object URL memory leak on unmount or value change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateFile = (file: File): boolean => {
    setLocalError(null);

    // Extension & Type Validation
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const isValidExt = allowedExtensions.includes(ext);
    const isValidMime = accept.split(',').some((type) => {
      const trimmed = type.trim();
      if (trimmed.endsWith('/*')) {
        return file.type.startsWith(trimmed.replace('/*', ''));
      }
      return file.type === trimmed;
    });

    if (!isValidExt && !isValidMime) {
      const errStr = `Invalid file type. Allowed formats: ${allowedExtensions.join(', ').toUpperCase()}`;
      setLocalError(errStr);
      toast.error(errStr);
      return false;
    }

    // Size Validation
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const errStr = `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${maxSizeMB}MB`;
      setLocalError(errStr);
      toast.error(errStr);
      return false;
    }

    return true;
  };

  const handleSelectFile = (file: File) => {
    if (!validateFile(file)) return;
    onChange(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleSelectFile(file);
    }
  };

  const handleClear = () => {
    onChange(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileName = useMemo(() => {
    if (value instanceof File) return value.name;
    if (typeof value === 'string' && value) return value.split('/').pop() || '';
    return '';
  }, [value]);

  const displayError = externalError || localError;

  // Render Single Avatar Variant (Pattern 2)
  if (variant === 'avatar') {
    return (
      <div className={`flex flex-col items-center justify-center space-y-2 text-center ${className}`}>
        {label && (
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
            {label}
          </label>
        )}

        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={accept}
          disabled={disabled}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Single Integrated Interactive Avatar Frame */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled) fileInputRef.current?.click();
          }}
          className={`relative group w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-900/90 shadow-md ${isDragging
            ? 'border-indigo-500 ring-4 ring-indigo-500/20'
            : displayError
              ? 'border-red-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/80'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <SafeImage
            src={previewUrl}
            alt="Avatar Photo"
            fallbackText={fallbackText}
            className="w-full h-full object-cover rounded-2xl"
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 p-2">
            <Camera size={18} className="text-indigo-400" />
            <span className="text-[10px] font-semibold text-slate-200">
              {value ? 'Change' : 'Upload'}
            </span>
          </div>
        </div>

        {/* Action Controls & Info */}
        <div className="space-y-1">
          {value ? (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 transition-all cursor-pointer"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Allowed: {allowedExtensions.join(', ').toUpperCase()} (Max {maxSizeMB}MB)
            </p>
          )}

          {displayError ? (
            <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-red-400 mt-1">
              <AlertCircle size={12} />
              <span>{displayError}</span>
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  // Render Default File Dropzone Variant (Pattern 2)
  return (
    <div className={`space-y-2 text-left ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 tracking-wide">
          {label}
        </label>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative group rounded-xl border-2 border-dashed transition-all p-3.5 flex flex-col items-center justify-center text-center cursor-pointer ${isDragging
          ? 'border-indigo-500 bg-indigo-500/10'
          : displayError
            ? 'border-red-500/80 bg-red-500/5'
            : 'border-slate-800 hover:border-indigo-500/60 bg-slate-900/60 hover:bg-slate-900/90'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => {
          if (!disabled) {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={accept}
          disabled={disabled}
          onChange={handleFileChange}
          className="hidden"
        />

        {value ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {accept.includes('image') ? (
                <SafeImage
                  src={previewUrl}
                  alt="Selected File Preview"
                  fallbackText="FILE"
                  className="w-9 h-9 shrink-0 rounded-lg object-cover border border-slate-700 bg-slate-950"
                />
              ) : (
                <div className="w-9 h-9 shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileText size={18} />
                </div>
              )}
              <div className="text-left min-w-0 flex-1 truncate">
                <span className="text-xs font-medium text-slate-200 truncate inline-flex items-center gap-1.5 max-w-full">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">{fileName}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={disabled}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 transition-all cursor-pointer shrink-0"
              >
                Change
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                disabled={disabled}
                className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
                title="Remove File"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Upload size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-200">
                <span className="text-indigo-400 underline decoration-indigo-400/40 underline-offset-2">
                  {placeholder}
                </span>{' '}
                or drag & drop
              </p>
              <p className="text-[11px] text-slate-400">
                Allowed: {allowedExtensions.join(', ').toUpperCase()} (Max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {displayError ? (
        <p className="flex items-center gap-1 text-[11px] font-medium text-red-400 mt-1">
          <AlertCircle size={12} />
          <span>{displayError}</span>
        </p>
      ) : null}
    </div>
  );
};
