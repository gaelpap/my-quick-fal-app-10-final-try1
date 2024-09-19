import React, { useState } from 'react';
import { generateImage } from '@/lib/image-generation';

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('english');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const imageUrl = await generateImage(prompt, language);
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label htmlFor="prompt" className="block text-gray-800 text-sm font-bold mb-2">
            Enter your prompt:
          </label>
          <input
            type="text"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="A futuristic city skyline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-800 text-sm font-bold mb-2">
            Select language:
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="language"
                value="english"
                checked={language === 'english'}
                onChange={() => setLanguage('english')}
              />
              <span className="ml-2 text-gray-800">English</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="language"
                value="french"
                checked={language === 'french'}
                onChange={() => setLanguage('french')}
              />
              <span className="ml-2 text-gray-800">French</span>
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {isLoading ? 'Generating...' : 'Generate Image'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {generatedImage && (
        <div className="mt-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Generated Image:</h2>
          <img src={generatedImage} alt="Generated" className="max-w-full h-auto rounded shadow-lg" />
        </div>
      )}
    </div>
  );
}