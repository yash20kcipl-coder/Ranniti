import { ImageOff } from 'lucide-react';
import React, { useState, useEffect, useRef, type ImgHTMLAttributes } from 'react';
import { getFileUrl } from '@/utils/baseUrl';

export interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  containerClassName?: string;
  showSkeleton?: boolean;
}

/**
 * Reusable Safe Image component with loading skeleton and error fallback handling.
 * Automatically resolves relative image paths and handles browser-cached images.
 * Enforces Rule 12 across all UI components.
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  fallbackText,
  className = '',
  containerClassName = '',
  showSkeleton = true,
  onError,
  onLoad,
  ...props
}) => {
  const resolvedSrc = getFileUrl(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Reset error/loading state when resolvedSrc changes or check if already cached by browser
  useEffect(() => {
    setHasError(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth !== 0) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [resolvedSrc]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) onError(e);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    if (onLoad) onLoad(e);
  };

  const getInitials = (text?: string): string => {
    if (!text) return '';
    const parts = text.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.slice(0, 2).toUpperCase();
  };

  if (!resolvedSrc || hasError) {
    const initials = getInitials(fallbackText || alt);
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs rounded-md select-none shrink-0 ${containerClassName} ${className}`}
        title={alt || fallbackText}
      >
        {initials ? (
          <span>{initials}</span>
        ) : (
          <ImageOff className="w-4 h-4 text-slate-400 dark:text-slate-600" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden shrink-0 ${containerClassName} ${className}`}>
      {isLoading && showSkeleton && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md" />
      )}
      <img
        ref={(img) => {
          imgRef.current = img;
          if (img && img.complete && img.naturalWidth !== 0) {
            setIsLoading(false);
          }
        }}
        src={resolvedSrc}
        alt={alt}
        className={`w-full h-full object-cover object-center ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        {...props}
      />
    </div>
  );
};

export default SafeImage;
