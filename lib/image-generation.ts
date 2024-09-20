import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.NEXT_PUBLIC_FAL_AI_API_KEY,
});

export async function generateImage(prompt: string, language: string): Promise<string> {
  try {
    const result = await fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt: `${language === 'french' ? 'En français: ' : ''}${prompt}`,
        num_images: 1,
      },
    });

    if (result && result.images && result.images.length > 0) {
      return result.images[0].url;
    } else {
      throw new Error('No image generated');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}