import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.NEXT_PUBLIC_FAL_AI_API_KEY,
});

interface ImageGenerationInput {
  prompt: string;
  num_images: number;
}

interface ImageGenerationResult {
  images: Array<{ url: string }>;
}

export async function generateImage(prompt: string, language: string): Promise<string> {
  try {
    console.log('Generating image with input:', { prompt, language });
    const input: ImageGenerationInput = {
      prompt: `${language === 'french' ? 'En français: ' : ''}${prompt}`,
      num_images: 1,
    };

    console.log('Calling Fal AI with input:', input);
    console.log('Using Fal AI model: fal-ai/flux-lora');
    const result = await fal.subscribe<ImageGenerationResult, ImageGenerationInput>("fal-ai/flux-lora", {
      input,
      pollInterval: 5000,
      logs: true,
    });

    console.log('Fal AI raw response:', JSON.stringify(result, null, 2));

    if (result && 'images' in result && Array.isArray(result.images) && result.images.length > 0) {
      console.log('Image URL:', result.images[0].url);
      return result.images[0].url;
    } else {
      console.error('Unexpected result structure:', result);
      throw new Error('No image generated');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}