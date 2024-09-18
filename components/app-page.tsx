'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { generateImage } from './actions'
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { UserImages } from './UserImages'
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { stripePromise } from '../lib/stripe';

interface LoRA {
  path: string;
  scale: number;
}

export function Page() {
  const [prompt, setPrompt] = useState('')
  const [loras, setLoras] = useState<LoRA[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [disableSafetyChecker, setDisableSafetyChecker] = useState(false)
  const [user, setUser] = useState<User | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const router = useRouter()

  useEffect(() => {
    const checkSubscription = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const subscriptionStatus = userDoc.data()?.isSubscribed || false;
        setIsSubscribed(subscriptionStatus);
        console.log('Subscription status:', subscriptionStatus);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        checkSubscription();
      } else {
        setIsSubscribed(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddLora = () => {
    if (loras.length < 2) {
      setLoras([...loras, { path: '', scale: 1 }])
    }
  }

  const handleRemoveLora = (index: number) => {
    setLoras(loras.filter((_, i) => i !== index))
  }

  const handleLoraChange = (index: number, field: keyof LoRA, value: string | number) => {
    const newLoras = [...loras]
    newLoras[index] = { ...newLoras[index], [field]: value }
    setLoras(newLoras)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to generate images.');
      return;
    }
    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const result = await generateImage(prompt, loras, disableSafetyChecker, idToken);
      console.log('Generation result:', result);
      setImageUrl(result.imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
      if (error instanceof Error) {
        alert(`Error generating image: ${error.message}`);
      } else {
        alert('An unknown error occurred while generating the image');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/'); // Redirect to home page after logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    const stripe = await stripePromise;
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: user.uid }),
    });
    const { sessionId } = await response.json();
    const result = await stripe?.redirectToCheckout({ sessionId });
    if (result?.error) {
      alert(result.error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Image Generator</h1>
        <Button onClick={handleLogout} className="bg-red-500 text-white">
          Logout
        </Button>
      </div>
      {!isSubscribed ? (
        <div className="text-center py-8">
          <h2 className="text-xl mb-4">Subscribe to start generating images</h2>
          <Button onClick={handleSubscribe} className="bg-blue-500 text-white">
            Subscribe for Free (Test Mode)
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-4">
          <Input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt"
            className="w-full p-2 mb-2 border rounded"
          />
          {loras.map((lora, index) => (
            <div key={index} className="flex mb-2">
              <Input
                type="text"
                value={lora.path}
                onChange={(e) => handleLoraChange(index, 'path', e.target.value)}
                placeholder="LoRA path"
                className="flex-grow p-2 mr-2 border rounded"
              />
              <Input
                type="number"
                value={lora.scale}
                onChange={(e) => handleLoraChange(index, 'scale', parseFloat(e.target.value))}
                step="0.1"
                min="0"
                max="1"
                className="w-20 p-2 border rounded mr-2"
              />
              <Button 
                type="button" 
                onClick={() => handleRemoveLora(index)}
                className="bg-red-500 text-white p-2 rounded"
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            onClick={handleAddLora}
            disabled={loras.length >= 2}
            className="bg-blue-500 text-white p-2 rounded mb-2 mr-2"
          >
            Add LoRA
          </Button>
          <label className="inline-flex items-center mb-2">
            <input
              type="checkbox"
              checked={disableSafetyChecker}
              onChange={(e) => setDisableSafetyChecker(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2 text-gray-700">Disable Safety Checker</span>
          </label>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-green-500 text-white p-2 rounded w-full"
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </Button>
        </form>
      )}
      {imageUrl && (
        <div>
          <h2 className="text-xl font-bold mb-2">Generated Image:</h2>
          <img src={imageUrl} alt="Generated" className="max-w-full h-auto mb-2" />
        </div>
      )}
      <UserImages />
    </div>
  )
}