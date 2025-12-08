import React, { useState, useRef } from 'react';
import { Coach } from '../../types';
import Button from '../ui/Button';

interface AvatarUploadProps {
  coach: Coach;
  onAvatarUpdated: (imageUrl: string) => Promise<void>;
}

// Sport/athletic themed abstract avatars
const DEFAULT_AVATARS = [
  // Abstract geometric shapes with sporty colors
  'https://api.dicebear.com/7.x/shapes/svg?seed=boxing1&backgroundColor=dc2626&shape1Color=ffffff&shape2Color=1f2937&shape3Color=dc2626',
  'https://api.dicebear.com/7.x/shapes/svg?seed=boxing2&backgroundColor=1f2937&shape1Color=dc2626&shape2Color=ffffff&shape3Color=fbbf24',
  'https://api.dicebear.com/7.x/shapes/svg?seed=boxing3&backgroundColor=dc2626&shape1Color=1f2937&shape2Color=ffffff&shape3Color=dc2626',
  'https://api.dicebear.com/7.x/shapes/svg?seed=boxing4&backgroundColor=1f2937&shape1Color=dc2626&shape2Color=fbbf24&shape3Color=ffffff',
  'https://api.dicebear.com/7.x/shapes/svg?seed=boxing5&backgroundColor=dc2626&shape1Color=ffffff&shape2Color=1f2937&shape3Color=fbbf24',
  // Abstract identicons with athletic theme
  'https://api.dicebear.com/7.x/identicon/svg?seed=athlete1&backgroundColor=dc2626&backgroundType=solid',
  'https://api.dicebear.com/7.x/identicon/svg?seed=athlete2&backgroundColor=1f2937&backgroundType=solid',
  'https://api.dicebear.com/7.x/identicon/svg?seed=athlete3&backgroundColor=dc2626&backgroundType=solid',
];

const AvatarUpload: React.FC<AvatarUploadProps> = ({ coach, onAvatarUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showDefaults, setShowDefaults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    
    // Convert to base64 data URL for storage in database
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Image = reader.result as string;
        setPreview(base64Image);
        await onAvatarUpdated(base64Image);
        setPreview(null);
      } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      alert('Failed to read image file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDefaultSelect = async (avatarUrl: string) => {
    setUploading(true);
    try {
      await onAvatarUpdated(avatarUrl);
      setShowDefaults(false);
    } catch (error) {
      console.error('Error setting default avatar:', error);
      alert('Failed to update avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Use the latest coach imageUrl, or preview if uploading
  const displayImage = preview || coach.imageUrl || DEFAULT_AVATARS[0];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <img
          src={displayImage}
          alt={coach.name}
          className="w-32 h-32 rounded-full object-cover border-4 border-brand-red cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => fileInputRef.current?.click()}
          onError={(e) => {
            // Fallback to default avatar if image fails to load
            (e.target as HTMLImageElement).src = DEFAULT_AVATARS[0];
          }}
        />
        {uploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <div className="text-white text-sm">Uploading...</div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-sm"
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowDefaults(!showDefaults)}
          disabled={uploading}
          className="text-sm"
        >
          Choose Default Avatar
        </Button>
      </div>

      {showDefaults && (
        <div className="bg-brand-dark p-4 rounded-lg mt-4">
          <p className="text-sm text-gray-400 mb-3 text-center">Select a default avatar:</p>
          <div className="grid grid-cols-4 gap-3">
            {DEFAULT_AVATARS.map((avatar, index) => (
              <button
                key={index}
                onClick={() => handleDefaultSelect(avatar)}
                className="w-20 h-20 rounded-full overflow-hidden border-2 border-transparent hover:border-brand-red transition-colors bg-brand-gray p-1"
                title={`Avatar ${index + 1}`}
              >
                <img
                  src={avatar}
                  alt={`Default avatar ${index + 1}`}
                  className="w-full h-full object-cover rounded-full"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;

