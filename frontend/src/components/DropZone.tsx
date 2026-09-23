import React, { useRef, useState } from 'react';
import { Camera, Upload, RefreshCw } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  selectedImageUrl: string | null;
  loading: boolean;
  predictedBreed?: string | null;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  selectedImageUrl,
  loading,
  predictedBreed,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
    // Reset value so re-selecting the same file or switching files always triggers onChange
    e.target.value = '';
  };

  const onButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!loading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      className={`group w-full max-w-[340px] mx-auto polaroid-frame cursor-pointer select-none hover:shadow-xl hover:-translate-y-1 hover:rotate-0 transition-all duration-300 ${
        selectedImageUrl ? 'rotate-1' : '-rotate-1'
      } ${
        isDragActive ? 'border-brand-400 bg-brand-50/10 scale-[1.01]' : 'border-[#EDEAE3]'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileInput}
        onClick={(e) => e.stopPropagation()}
        disabled={loading}
      />

      {/* Main Image Frame */}
      <div className="w-full aspect-square rounded bg-[#FAF9F6] border border-[#ECE9E0] relative overflow-hidden flex flex-col items-center justify-center shadow-inner group-hover:border-[#E1DDD0] transition-colors">
        {selectedImageUrl ? (
          <>
            {/* The Photo */}
            <img
              crossOrigin="anonymous"
              src={selectedImageUrl}
              alt="Selected pet"
              className={`w-full h-full object-cover transition-all duration-700 ${
                loading ? 'brightness-75 blur-[2px] scale-95' : 'brightness-100 blur-0 scale-100'
              }`}
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-[#2E2A27]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <span className="text-white text-xs font-semibold tracking-wider uppercase bg-[#2E2A27]/80 py-1.5 px-3 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                Replace Photo
              </span>
            </div>
            {/* Loading indicator */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-[#2E2A27] bg-white/90 py-0.5 px-2 rounded shadow-sm font-sans animate-pulse">
                    Analyzing...
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty Polaroid State */
          <div className="p-6 flex flex-col items-center justify-center text-center gap-3 w-full h-full">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform duration-300">
              <Camera size={28} className="stroke-[1.5]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#4E4844] tracking-tight">
                Upload Pet Photo
              </p>
              <p className="text-xs text-[#8A8177] mt-1 px-4 leading-relaxed">
                Drag & drop your pet's photo here, or click to browse files
              </p>
            </div>
            <div className="mt-2 text-[10px] uppercase font-bold tracking-wider text-brand-500 bg-brand-100/50 py-1 px-2.5 rounded-full border border-brand-200/50">
              Select JPG, PNG, WEBP
            </div>
          </div>
        )}
      </div>

      {/* Polaroid Signature Bottom Border */}
      <div className="pt-5 flex items-center justify-center min-h-[48px]">
        {loading ? (
          <span className="text-xl font-handwritten text-[#8A8177] animate-pulse">
            Analyzing details...
          </span>
        ) : predictedBreed ? (
          <span className="text-2xl font-handwritten text-brand-700 font-bold tracking-wide">
            {predictedBreed}
          </span>
        ) : selectedImageUrl ? (
          <span className="text-lg font-handwritten text-[#8A8177]">
            Selected Pet Photo
          </span>
        ) : (
          <span className="text-lg font-handwritten text-[#A0988E] flex items-center gap-1">
            <Upload size={14} className="stroke-[1.5] animate-bounce" />
            Drop photo here
          </span>
        )}
      </div>
    </div>
  );
};
