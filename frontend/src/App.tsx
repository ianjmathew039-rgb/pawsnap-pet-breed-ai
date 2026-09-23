import { useEffect, useRef, useState } from 'react';
import { DropZone } from './components/DropZone';
import { SampleSelector } from './components/SampleSelector';
import { ResultsPanel } from './components/ResultsPanel';
import { SupportedBreeds } from './components/SupportedBreeds';
import { AlertCircle, PawPrint, X } from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const getApiUrl = (path: string) =>
  API_BASE_URL ? `${API_BASE_URL}${path}` : `/api${path}`;

const getAssetUrl = (path: string) =>
  API_BASE_URL ? `${API_BASE_URL}/${path.replace(/^\//, '')}` : `/${path.replace(/^\//, '')}`;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

interface Sample {
  path: string;
  name: string;
}

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

function App() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [about, setAbout] = useState<string>('');
  const [breedDetails, setBreedDetails] = useState<BreedDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Fetch samples on load
  useEffect(() => {
    fetch(getApiUrl('/samples'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load samples');
        return res.json();
      })
      .then((data) => setSamples(data))
      .catch((err) => {
        console.error('Error fetching samples:', err);
        // Fallback static samples in case API fails
        setSamples([
          { path: 'sample-images/bengal.jpg', name: 'Bengal' },
          { path: 'sample-images/chihuahua.jpg', name: 'Chihuahua' },
          { path: 'sample-images/doberman.jpg', name: 'Doberman' },
          { path: 'sample-images/pug.jpg', name: 'Pug' },
          { path: 'sample-images/samoyed.jpg', name: 'Samoyed' },
        ]);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const sendPredictionRequest = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(getApiUrl('/predict'), {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData: { detail?: string } = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Prediction failed');
      }

      const data = await res.json();
      if (data.success) {
        setPredictions(data.predictions);
        setAbout(data.about);
        setBreedDetails(data.breed_details);
      } else {
        throw new Error('Unsuccessful classification');
      }
    } catch (err: unknown) {
      console.error('Prediction error:', err);
      setError(getErrorMessage(err, 'An error occurred during prediction.'));
      setPredictions([]);
      setAbout('');
      setBreedDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = URL.createObjectURL(file);
    setSelectedImageUrl(objectUrlRef.current);
    sendPredictionRequest(file);
  };

  const handleSelectSample = async (sample: Sample) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const imageUrl = getAssetUrl(sample.path);
    setSelectedImageUrl(imageUrl);
    setLoading(true);
    setError(null);
    setPredictions([]);
    setAbout('');
    setBreedDetails(null);

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to download sample image');
      
      const blob = await response.blob();
      const filename = sample.path.split('/').pop() || 'sample.jpg';
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      
      await sendPredictionRequest(file);
    } catch (err: unknown) {
      console.error('Error loading sample image:', err);
      setError('Could not process the selected sample image. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-brand-500 text-white rounded-full shadow-md shadow-brand-500/20 hover:scale-105 transition-transform duration-300">
            <PawPrint size={24} className="rotate-12" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#2E2A27]">
              PawSnap
            </h1>
            <p className="max-w-md mx-auto text-xs sm:text-sm text-[#8A8177] font-medium leading-relaxed">
              Snap a photo. Discover the breed. Learn how to care for it.
            </p>
          </div>
        </header>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50/70 border-l-4 border-red-500 rounded-r-xl flex items-start justify-between gap-3 max-w-xl mx-auto shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="font-bold text-red-950 text-xs uppercase tracking-wider">Analysis Failed</h4>
                <p className="text-xs text-red-800 mt-1">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-700 transition-colors p-1"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Workspace Layout */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start pt-4">
          
          {/* Left Column: Actions */}
          <section className="space-y-8 flex flex-col items-center">
            <DropZone
              onFileSelect={handleFileSelect}
              selectedImageUrl={selectedImageUrl}
              loading={loading}
              predictedBreed={predictions.length > 0 ? predictions[0].breed_name : null}
            />
            <SampleSelector
              samples={samples}
              onSelectSample={handleSelectSample}
              loading={loading}
              getImageUrl={getAssetUrl}
            />
            <SupportedBreeds />
          </section>

          {/* Right Column: Results */}
          <section className="h-full">
            <ResultsPanel
              predictions={predictions}
              about={about}
              breedDetails={breedDetails}
              loading={loading}
            />
          </section>
          
        </main>

        {/* Footer */}
        <footer className="text-center text-[10px] uppercase tracking-wider text-[#A0988E] font-bold pt-12 border-t border-[#EDEAE3]">
          PawSnap by a Raccoon
        </footer>
      </div>
    </div>
  );
}

export default App;
