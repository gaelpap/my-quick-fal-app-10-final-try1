'use server'

import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY,
});

interface LoRA {
  path: string;
  scale: number;
}

export async function generateImage(prompt: string, loras: LoRA[], disableSafetyChecker: boolean) {
  try {
    console.log('Generating image with params:', { prompt, loras, disableSafetyChecker });
    const result = await fal.run('fal-ai/flux-lora', {
      input: {
        prompt: prompt,
        loras: loras,
        disable_safety_checker: disableSafetyChecker,
      }
    });

    console.log('Image generation result:', result);

    if (result.images && result.images.length > 0) {
      console.log('Generated image URL:', result.images[0].url);
      return { imageUrl: result.images[0].url };
    } else {
      console.error('No image generated in the result');
      throw new Error('No image generated');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}