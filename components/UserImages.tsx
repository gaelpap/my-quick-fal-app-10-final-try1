import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';  // Import auth and db directly
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import Image from 'next/image';

interface UserImage {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
}

export function UserImages() {
  const [images, setImages] = useState<UserImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed in UserImages, user:', user?.uid);
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      if (!userId) {
        console.log('No user ID, not fetching images');
        setError('Please log in to view your images.');
        return;
      }

      console.log('Fetching images for user:', userId);
      
      try {
        const q = query(collection(db, 'users', userId, 'images'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const userImages: UserImage[] = [];
        querySnapshot.forEach((doc) => {
          userImages.push({ id: doc.id, ...doc.data() } as UserImage);
        });
        setImages(userImages);
        console.log('Fetched images:', userImages);
      } catch (error) {
        console.error('Error fetching images:', error);
        setError('Failed to fetch images. Please try again later.');
      }
    };

    if (userId) {
      fetchImages();
    }
  }, [userId]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Your Generated Images</h2>
      {images.length === 0 ? (
        <p>No images generated yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="border rounded p-2">
              <Image 
                src={image.imageUrl} 
                alt={image.prompt} 
                width={500}  // Specify width
                height={500} // Specify height
              />
              <p className="mt-2 text-sm">{image.prompt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}