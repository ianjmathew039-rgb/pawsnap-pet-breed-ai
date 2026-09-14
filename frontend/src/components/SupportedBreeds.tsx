import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SUPPORTED_BREEDS = {
  felines: [
    'Abyssinian', 'American Bobtail', 'American Curl', 'American Shorthair', 'American Wirehair', 
    'Applehead Siamese', 'Balinese', 'Bengal', 'Birman', 'Bombay', 'British Shorthair', 
    'Burmese', 'Burmilla', 'Calico', 'Chartreux', 'Chausie', 'Cornish Rex', 'Cymric', 
    'Devon Rex', 'Dilute Calico', 'Dilute Tortoiseshell', 'Domestic Long Hair', 'Domestic Medium Hair', 
    'Domestic Short Hair', 'Egyptian Mau', 'Exotic Shorthair', 'Havana', 'Himalayan', 
    'Japanese Bobtail', 'Javanese', 'Korat', 'Laperm', 'Maine Coon', 'Manx', 'Munchkin', 
    'Nebelung', 'Norwegian Forest Cat', 'Ocicat', 'Oriental Long Hair', 'Oriental Short Hair', 
    'Oriental Tabby', 'Persian', 'Pixiebob', 'Ragamuffin', 'Ragdoll', 'Russian Blue', 
    'Scottish Fold', 'Selkirk Rex', 'Siamese', 'Siberian', 'Silver', 'Singapura', 
    'Snowshoe', 'Somali', 'Sphynx', 'Tabby', 'Tiger', 'Tonkinese', 'Torbie', 
    'Tortoiseshell', 'Turkish Angora', 'Turkish Van', 'Tuxedo', 'Extra Toes Cat Hemingway Polydactyl'
  ],
  canines: [
    'Affenpinscher', 'Afghan Hound', 'African Hunting Dog', 'Airedale', 'American Staffordshire Terrier', 
    'Appenzeller', 'Australian Terrier', 'Basenji', 'Basset', 'Beagle', 'Bedlington Terrier', 
    'Bernese Mountain Dog', 'Black And Tan Coonhound', 'Blenheim Spaniel', 'Bloodhound', 'Bluetick', 
    'Border Collie', 'Border Terrier', 'Borzoi', 'Boston Bull', 'Bouvier Des Flandres', 'Boxer', 
    'Brabancon Griffon', 'Briard', 'Brittany Spaniel', 'Bull Mastiff', 'Cairn', 'Cardigan', 
    'Chesapeake Bay Retriever', 'Chihuahua', 'Chow', 'Clumber', 'Cocker Spaniel', 'Collie', 
    'Curly Coated Retriever', 'Dandie Dinmont', 'Dhole', 'Dingo', 'Doberman', 'English Foxhound', 
    'English Setter', 'English Springer', 'Entlebucher', 'Eskimo Dog', 'Flat Coated Retriever', 
    'French Bulldog', 'German Shepherd', 'German Short Haired Pointer', 'Giant Schnauzer', 
    'Golden Retriever', 'Gordon Setter', 'Great Dane', 'Great Pyrenees', 'Greater Swiss Mountain Dog', 
    'Groenendael', 'Ibizan Hound', 'Irish Setter', 'Irish Terrier', 'Irish Water Spaniel', 
    'Irish Wolfhound', 'Italian Greyhound', 'Japanese Spaniel', 'Keeshond', 'Kelpie', 
    'Kerry Blue Terrier', 'Komondor', 'Kuvasz', 'Labrador Retriever', 'Lakeland Terrier', 
    'Leonberg', 'Lhasa', 'Malamute', 'Malinois', 'Maltese Dog', 'Mexican Hairless', 
    'Miniature Pinscher', 'Miniature Poodle', 'Miniature Schnauzer', 'Newfoundland', 'Norfolk Terrier', 
    'Norwegian Elkhound', 'Norwich Terrier', 'Old English Sheepdog', 'Otterhound', 'Papillon', 
    'Pekinese', 'Pembroke', 'Pomeranian', 'Pug', 'Redbone', 'Rhodesian Ridgeback', 
    'Rottweiler', 'Saint Bernard', 'Saluki', 'Samoyed', 'Schipperke', 'Scotch Terrier', 
    'Scottish Deerhound', 'Sealyham Terrier', 'Shetland Sheepdog', 'Shih Tzu', 'Siberian Husky', 
    'Silky Terrier', 'Soft Coated Wheaten Terrier', 'Staffordshire Bullterrier', 'Standard Poodle', 
    'Standard Schnauzer', 'Sussex Spaniel', 'Tibetan Mastiff', 'Tibetan Terrier', 'Toy Poodle', 
    'Toy Terrier', 'Vizsla', 'Walker Hound', 'Weimaraner', 'Welsh Springer Spaniel', 
    'West Highland White Terrier', 'Whippet', 'Wire Haired Fox Terrier', 'Yorkshire Terrier'
  ]
};

export const SupportedBreeds: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-[340px] border border-[#EDEAE3] bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left focus:outline-none select-none hover:bg-[#FAF9F6] transition-colors duration-200"
      >
        <div className="space-y-0.5 pr-2">
          <span className="text-xs font-bold text-[#4E4844] flex items-center gap-1.5">
            <Sparkles size={12} className="text-brand-500" />
            Supported Breeds (184)
          </span>
          <p className="text-[10px] text-[#8A8177] leading-tight">
            Classifies 184 cat and dog breeds from the prepared dataset.
          </p>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-[#A0988E] transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Expandable Section */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-[#F2EFE8]"
          >
            <div className="p-4 bg-[#FAF9F6]/40 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
              
              {/* Cats (Felines) */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-bold uppercase tracking-wider text-[#3D5C47] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3D5C47]/60"></span>
                  Felines ({SUPPORTED_BREEDS.felines.length} breeds)
                </h4>
                <div className="flex flex-wrap gap-1">
                  {SUPPORTED_BREEDS.felines.map((breed) => (
                    <span 
                      key={breed} 
                      className="px-2 py-0.5 text-[9px] font-medium text-[#3D5C47] bg-[#EAF0EC] rounded border border-[#D5E2D9]"
                    >
                      {breed}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dogs (Canines) */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-bold uppercase tracking-wider text-[#94412C] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#94412C]/60"></span>
                  Canines ({SUPPORTED_BREEDS.canines.length} breeds)
                </h4>
                <div className="flex flex-wrap gap-1">
                  {SUPPORTED_BREEDS.canines.map((breed) => (
                    <span 
                      key={breed} 
                      className="px-2 py-0.5 text-[9px] font-medium text-[#94412C] bg-[#F7EBE8] rounded border border-[#EED4CE]"
                    >
                      {breed}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
