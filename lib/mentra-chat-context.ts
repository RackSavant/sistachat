import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface MentraPhoto {
  id: string;
  imageUrl: string;
  audioUrl?: string;
  feedback?: string;
  timestamp: string;
}

interface MentraChatState {
  photos: MentraPhoto[];
  addPhoto: (photo: MentraPhoto) => void;
  getLatestPhoto: () => MentraPhoto | undefined;
  clearPhotos: () => void;
}

// Create a store to manage Mentra photos that can be accessed across components
export const useMentraPhotos = create<MentraChatState>()(
  persist(
    (set, get) => ({
      photos: [],
      addPhoto: (photo) => set((state) => ({ 
        photos: [photo, ...state.photos].slice(0, 20) // Keep only the last 20 photos
      })),
      getLatestPhoto: () => {
        const { photos } = get();
        return photos.length > 0 ? photos[0] : undefined;
      },
      clearPhotos: () => set({ photos: [] }),
    }),
    {
      name: 'mentra-photos-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// Server-side function to add a photo (for webhook use)
export async function addMentraPhotoServerSide(photo: MentraPhoto) {
  // Store in database for persistence
  const { createClient } = await import('@/utils/supabase/server');
  const supabase = await createClient();
  
  try {
    // Store the photo metadata in a new table for real-time access
    const { error } = await supabase
      .from('mentra_chat_photos')
      .insert({
        id: photo.id,
        image_url: photo.imageUrl,
        audio_url: photo.audioUrl,
        feedback: photo.feedback,
        timestamp: photo.timestamp,
        status: 'new' // Mark as new for real-time notification
      });
      
    if (error) {
      console.error('Failed to store Mentra photo for chat:', error);
    }
    
    return !error;
  } catch (error) {
    console.error('Error storing Mentra photo:', error);
    return false;
  }
}

// Function to get recent Mentra photos from the database
export async function getRecentMentraPhotos() {
  const { createClient } = await import('@/utils/supabase/server');
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('mentra_chat_photos')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('Failed to fetch Mentra photos:', error);
      return [];
    }
    
    return data.map(item => ({
      id: item.id,
      imageUrl: item.image_url,
      audioUrl: item.audio_url,
      feedback: item.feedback,
      timestamp: item.timestamp
    }));
  } catch (error) {
    console.error('Error fetching Mentra photos:', error);
    return [];
  }
}
