import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import JSZip from 'jszip';

// Remove these lines
// fal.config({
//   credentials: process.env.NEXT_PUBLIC_FAL_AI_API_KEY,
// });

function LoraTraining() {
  const [files, setFiles] = useState<File[]>([]);
  const [triggerWord, setTriggerWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [savedModels, setSavedModels] = useState<{id: string, url: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedModels();
  }, []);

  const fetchSavedModels = async () => {
    setError(null);
    const user = auth.currentUser;
    if (user) {
      try {
        const q = query(collection(db, "loraModels"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const models = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as {url: string} }));
        setSavedModels(models);
      } catch (err) {
        if (err instanceof FirebaseError) {
          console.error("Firebase error:", err);
          setError("Failed to fetch saved models. Please try again later.");
        } else {
          console.error("Unknown error:", err);
          setError("An unexpected error occurred. Please try again later.");
        }
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (files.length === 0) {
        throw new Error("Please select at least one image file.");
      }

      const fileUrl = await uploadFiles(files);

      console.log('Sending request to API with:', { images_data_url: fileUrl.substring(0, 50) + '...', trigger_word: triggerWord });

      const response = await fetch('/api/lora-training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images_data_url: fileUrl,
          trigger_word: triggerWord,
        }),
      });

      const data = await response.json();
      console.log('Full API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start Lora training');
      }

      await pollForResults(data.request_id);
    } catch (error) {
      console.error('Error during Lora training:', error);
      if (error instanceof Error) {
        setError(`${error.message}${error.stack ? `\n${error.stack}` : ''}`);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFiles = async (files: File[]): Promise<string> => {
    const storage = getStorage();
    const zip = new JSZip();

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      zip.file(file.name, arrayBuffer);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const storageRef = ref(storage, `uploads/${Date.now()}.zip`);
    
    await uploadBytes(storageRef, zipBlob);
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log("Uploaded file URL:", downloadURL);
    return downloadURL;
  };

  const pollForResults = async (requestId: string) => {
    const maxAttempts = 60; // 30 minutes with 30-second intervals
    let attempts = 0;

    const checkStatus = async () => {
      // Replace the direct fal.queue.status call with a fetch to our API route
      const response = await fetch(`/api/lora-training-status?requestId=${requestId}`);
      const status = await response.json();

      console.log("Status:", status.status);

      if (status.status === 'COMPLETED') {
        // Replace the direct fal.queue.result call with a fetch to our API route
        const resultResponse = await fetch(`/api/lora-training-result?requestId=${requestId}`);
        const result = await resultResponse.json();
        if (result && result.diffusers_lora_file && result.diffusers_lora_file.url) {
          const modelUrl = result.diffusers_lora_file.url;
          setResult(modelUrl);
          await saveModelToUserAccount(modelUrl);
        } else {
          throw new Error('Unexpected result format from Lora training');
        }
      } else if (status.status === 'FAILED') {
        throw new Error('Lora training failed: ' + (status.error || 'Unknown error'));
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkStatus, 30000); // Check every 30 seconds
      } else {
        throw new Error('Timeout: Lora training took too long');
      }
    };

    await checkStatus();
  };

  const saveModelToUserAccount = async (modelUrl: string) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, "loraModels"), {
          userId: user.uid,
          url: modelUrl,
          createdAt: new Date(),
          triggerWord: triggerWord
        });
        await fetchSavedModels();
      } catch (error) {
        console.error("Error saving model to user account:", error);
        setError("Failed to save the model to your account. Please try again.");
      }
    } else {
      setError("User not authenticated. Please log in and try again.");
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Lora Training</h1>
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label className="block mb-2 text-gray-700">Upload Images (ZIP file recommended)</label>
          <input type="file" multiple onChange={handleFileUpload} className="border p-2 w-full text-gray-700" />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-gray-700">Trigger Word</label>
          <input
            type="text"
            value={triggerWord}
            onChange={(e) => setTriggerWord(e.target.value)}
            placeholder="Trigger Word"
            className="border p-2 w-full text-gray-700"
          />
        </div>
        <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          {isLoading ? 'Training...' : 'Start Training'}
        </button>
      </form>
      {result && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2 text-gray-800">Training Complete</h2>
          <a href={result} download className="text-blue-500 hover:text-blue-700 underline">Download Lora Model</a>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold mb-2 text-gray-800">Saved Models</h2>
        {savedModels.length > 0 ? (
          <ul>
            {savedModels.map((model) => (
              <li key={model.id} className="mb-2">
                <a href={model.url} download className="text-blue-500 hover:text-blue-700 underline">{model.url}</a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No saved models found.</p>
        )}
      </div>
    </div>
  );
}

export default LoraTraining;