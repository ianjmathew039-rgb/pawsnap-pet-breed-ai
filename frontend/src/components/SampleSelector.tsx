import React, { useState } from 'react';

interface Sample {
  path: string;
  name: string;
}

interface SampleSelectorProps {
  samples: Sample[];
  onSelectSample: (sample: Sample) => void;
  loading: boolean;
  getImageUrl: (path: string) => string;
}

export const SampleSelector: React.FC<SampleSelectorProps> = ({
  samples,
  onSelectSample,
  loading,
  getImageUrl,
}) => {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  if (samples.length === 0) {
    return null;
  }

  const handleImageError = (path: string) => {
    setFailedImages((prev) => ({ ...prev, [path]: true }));
  };

  return (
    <div className="w-full max-w-[340px] mx-auto">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#A0988E] mb-3 text-center">
        Try a sample pet photo
      </h3>
      <div className="grid grid-cols-5 gap-2.5">
        {samples.map((sample) => {
          const imageUrl = getImageUrl(sample.path);
          const isFailed = failedImages[sample.path];

          return (
            <button
              key={sample.path}
              type="button"
              disabled={loading}
              onClick={() => onSelectSample(sample)}
              className="flex flex-col items-center gap-1.5 p-1 pb-2.5 rounded border border-[#EDEAE3] bg-white shadow-sm hover:shadow-md hover:-rotate-1 active:scale-[0.97] transition-all duration-300 disabled:opacity-40 group focus:outline-none focus:ring-1 focus:ring-brand-300"
            >
              <div className="w-full aspect-square rounded bg-[#FAF9F6] border border-[#F2EFE8] relative overflow-hidden flex items-center justify-center shadow-inner">
                {isFailed ? (
                  <svg 
                    className="w-5 h-5 text-brand-300/60" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3 3 3s3-1 3-3c0-1.66-1.34-3-3-3zm-4.5-2.5c-.83 0-1.5.67-1.5 1.5 0 1.2 1 1.5 1.5 1.5s1.5-.3 1.5-1.5c0-.83-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5 0 1.2 1 1.5 1.5 1.5s1.5-.3 1.5-1.5c0-.83-.67-1.5-1.5-1.5zm-6.75-3.5c-.69 0-1.25.56-1.25 1.25 0 1 .8 1.25 1.25 1.25s1.25-.25 1.25-1.25c0-.69-.56-1.25-1.25-1.25zm4.5 0c-.69 0-1.25.56-1.25 1.25 0 1 .8 1.25 1.25 1.25s1.25-.25 1.25-1.25c0-.69-.56-1.25-1.25-1.25z" />
                  </svg>
                ) : (
                  <img
                    src={imageUrl}
                    alt={sample.name}
                    loading="lazy"
                    onError={() => handleImageError(sample.path)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <span className="text-[9px] font-bold text-[#8A8177] truncate max-w-full text-center group-hover:text-brand-700 transition-colors font-sans">
                {sample.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
