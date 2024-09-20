import React, { useState } from 'react';
import { generateImage } from '../../lib/image-generation';

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
      console.log('Generating image with prompt:', prompt, 'and language:', language);
      console.log('FAL_AI_API_KEY:', process.env.NEXT_PUBLIC_FAL_AI_API_KEY ? 'Set (length: ' + process.env.NEXT_PUBLIC_FAL_AI_API_KEY.length + ')' : 'Not set');
      const imageUrl = await generateImage(prompt, language);
      console.log('Generated image URL:', imageUrl);
      setGeneratedImage(imageUrl);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label htmlFor="prompt" className="block text-black text-sm font-bold mb-2" style={{color: 'black'}}>
            Enter your prompt:
          </label>
          <input
            type="text"
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
            placeholder="A futuristic city skyline"
            style={{color: 'black'}}
          />
        </div>
        <div className="mb-4">
          <label className="block text-black text-sm font-bold mb-2" style={{color: 'black'}}>
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
              <span className="ml-2 text-black" style={{color: 'black'}}>English</span>
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
              <span className="ml-2 text-black" style={{color: 'black'}}>French</span>
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
          <h2 className="text-xl font-bold text-black mb-2">Generated Image:</h2>
          <img src={generatedImage} alt="Generated" className="max-w-full h-auto rounded shadow-lg" />
        </div>
      )}
    </div>
  );
}