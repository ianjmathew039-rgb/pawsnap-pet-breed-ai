import React from 'react';
import { motion } from 'framer-motion';
import { Award, Info, Sparkles, Compass } from 'lucide-react';

interface Prediction {
  rank: number;
  raw_name: string;
  breed_name: string;
  confidence: number;
  pet_type: string;
}

interface BreedDetails {
  breed_name: string;
  description: string;
  origin: string;
  temperament: string;
  size: string;
  life_expectancy: string;
  exercise_needs: string;
  grooming_requirements: string;
  care_tips: {
    diet_nutrition: string;
    exercise_requirements: string;
    grooming_frequency: string;
    training_difficulty: string;
    health_considerations: string;
    suitable_living_environment: string;
    family_friendliness: string;
    good_with_children: string;
    good_with_other_pets: string;
  };
}

interface ResultsPanelProps {
  predictions: Prediction[];
  about: string;
  breedDetails: BreedDetails | null;
  loading: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  predictions,
  about,
  breedDetails,
  loading,
}) => {
  if (loading) {
    return (
      <div className="premium-panel p-10 flex flex-col items-center justify-center min-h-[420px] text-center border-dashed border border-brand-300/60 bg-[#FAF9F6]/20">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-12 h-12 border-4 border-[#EDEAE3] border-t-brand-500 rounded-full animate-spin"></div>
          <Sparkles className="absolute text-brand-400 animate-pulse" size={20} />
        </div>
        <h4 className="text-sm font-bold text-[#4E4844] uppercase tracking-wider">
          Analyzing Image
        </h4>
        <p className="mt-2 text-xs text-[#8A8177] max-w-xs leading-relaxed font-sans">
          Extracting deep visual features, ear shape, snout geometry, and coat textures...
        </p>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="premium-panel p-10 flex flex-col items-center justify-center min-h-[420px] text-center bg-[#FAF9F6]/30">
        <div className="w-12 h-12 rounded-full bg-[#F5F2EB] flex items-center justify-center text-[#A0988E] mb-4 border border-[#EDEAE3]/60">
          <Compass size={20} className="stroke-[1.5]" />
        </div>
        <h4 className="text-xs font-bold text-[#4E4844] uppercase tracking-wider">
          Ready for Analysis
        </h4>
        <p className="mt-2 text-xs text-[#8A8177] max-w-xs leading-relaxed font-sans">
          Upload a pet photo or select one from our reference deck to run the breed classification model.
        </p>
      </div>
    );
  }

  const primary = predictions[0];
  const isFeline = primary.pet_type.toLowerCase() === 'feline';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="premium-panel overflow-hidden space-y-6"
    >
      {/* 1. Hero Result Section */}
      <div className="p-8 pb-6 border-b border-[#F2EFE8] bg-[#FDFBFA]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                isFeline 
                  ? 'bg-[#EAF0EC] text-[#3D5C47]' 
                  : 'bg-[#F7EBE8] text-[#94412C]'
              }`}>
                {primary.pet_type}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0988E] flex items-center gap-1">
                <Award size={12} className="text-brand-500" />
                Primary Prediction
              </span>
            </div>
            
            <h2 className="text-3xl font-serif font-extrabold text-[#2E2A27] tracking-tight">
              {primary.breed_name}
            </h2>
          </div>
          
          <div className="flex sm:flex-col sm:items-end justify-between items-center bg-[#FAF9F6] sm:bg-transparent p-3 sm:p-0 rounded-xl">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#A0988E] sm:block">
              Confidence Score
            </span>
            <span className="text-4xl font-extrabold font-serif text-brand-600 sm:mt-0.5">
              {primary.confidence.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top-3 Rankings Deck */}
      <div className="px-8 py-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#A0988E] mb-4">
          Top Predictions
        </h3>
        
        <div className="space-y-4">
          {predictions.map((pred) => {
            const isTopRank = pred.rank === 1;
            return (
              <div key={pred.rank} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#4E4844]">
                  <span className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-sans text-white ${
                      isTopRank ? 'bg-[#C86A50]' : 'bg-[#D9D2C9]'
                    }`}>
                      {pred.rank}
                    </span>
                    {pred.breed_name}
                  </span>
                  <span className="text-[#8A8177] font-medium">{pred.confidence.toFixed(2)}%</span>
                </div>
                
                <div className="w-full h-1.5 bg-[#F5F2EB] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pred.confidence}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${
                      isTopRank ? 'bg-[#C86A50]' : 'bg-[#D9D2C9]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Breed Information Section */}
      <div className="px-8 py-4 border-t border-[#F2EFE8] bg-[#FAF9F6]/40">
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Info size={16} className="text-brand-500" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#A0988E]">
              About This Breed
            </h4>
          </div>
          
          <p className="text-sm text-[#5D554E] leading-relaxed font-sans">
            {about}
          </p>

          {breedDetails && (
            <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-3 bg-white rounded-lg border border-[#EDEAE3]/60 shadow-sm">
                <span className="block text-[9px] uppercase font-bold text-[#A0988E] tracking-wider mb-0.5">Origin</span>
                <span className="font-semibold text-[#4E4844]">{breedDetails.origin}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-[#EDEAE3]/60 shadow-sm">
                <span className="block text-[9px] uppercase font-bold text-[#A0988E] tracking-wider mb-0.5">Temperament</span>
                <span className="font-semibold text-[#4E4844] line-clamp-2" title={breedDetails.temperament}>
                  {breedDetails.temperament}
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-[#EDEAE3]/60 shadow-sm">
                <span className="block text-[9px] uppercase font-bold text-[#A0988E] tracking-wider mb-0.5">Life Expectancy</span>
                <span className="font-semibold text-[#4E4844]">{breedDetails.life_expectancy}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-[#EDEAE3]/60 shadow-sm">
                <span className="block text-[9px] uppercase font-bold text-[#A0988E] tracking-wider mb-0.5">Size</span>
                <span className="font-semibold text-[#4E4844]">{breedDetails.size}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Care Tips Section */}
      {breedDetails && (
        <div className="px-8 py-6 border-t border-[#F2EFE8] bg-[#FDFBFA]">
          <div className="space-y-5">
            <div className="flex gap-2 items-center">
              <Sparkles size={16} className="text-brand-500" />
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#A0988E]">
                Practical Care Tips
              </h4>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-[#4E4844] block">🍎 Diet & Nutrition</span>
                  <p className="text-[#6E645E] leading-relaxed font-sans">{breedDetails.care_tips.diet_nutrition}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[#4E4844] block">🏃‍♂️ Exercise Requirements</span>
                  <p className="text-[#6E645E] leading-relaxed font-sans">{breedDetails.care_tips.exercise_requirements}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[#4E4844] block">✂️ Grooming & Care</span>
                  <p className="text-[#6E645E] leading-relaxed font-sans">{breedDetails.care_tips.grooming_frequency}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[#4E4844] block">🎓 Training Difficulty</span>
                  <p className="text-[#6E645E] leading-relaxed font-sans">{breedDetails.care_tips.training_difficulty}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[#4E4844] block">🩺 Health Considerations</span>
                  <p className="text-[#6E645E] leading-relaxed font-sans">{breedDetails.care_tips.health_considerations}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[#4E4844] block">🏡 Ideal Environment</span>
                  <p className="text-[#6E645E] leading-relaxed font-sans">{breedDetails.care_tips.suitable_living_environment}</p>
                </div>
              </div>

              {/* Social Qualities deck */}
              <div className="pt-3 border-t border-[#EDEAE3] grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                <div className="p-2 bg-[#FAF9F6] rounded-lg border border-[#EDEAE3]/40">
                  <span className="text-[#8A8177] block uppercase tracking-wide text-[8px] mb-0.5">Family-Friendly</span>
                  <span className="text-[#4E4844]">{breedDetails.care_tips.family_friendliness}</span>
                </div>
                <div className="p-2 bg-[#FAF9F6] rounded-lg border border-[#EDEAE3]/40">
                  <span className="text-[#8A8177] block uppercase tracking-wide text-[8px] mb-0.5">With Children</span>
                  <span className="text-[#4E4844]">{breedDetails.care_tips.good_with_children}</span>
                </div>
                <div className="p-2 bg-[#FAF9F6] rounded-lg border border-[#EDEAE3]/40">
                  <span className="text-[#8A8177] block uppercase tracking-wide text-[8px] mb-0.5">With Other Pets</span>
                  <span className="text-[#4E4844]">{breedDetails.care_tips.good_with_other_pets}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

