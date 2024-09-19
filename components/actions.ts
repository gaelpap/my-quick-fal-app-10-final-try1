'use client'

import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.NEXT_PUBLIC_FAL_KEY,
});

interface LoRA {
  path: string;
  scale: number;
}

export async function generateImage(prompt: string, loras: LoRA[], disableSafetyChecker: boolean) {
  try {
    const result = await fal.run('fal-ai/fast-sdxl', {
      prompt: prompt,
      loras: loras,
      disable_safety_checker: disableSafetyChecker,
    });

    console.log('Image generation result:', result);

    if (result.images && result.images.length > 0) {
      return { imageUrl: result.images[0].url };
    } else {
      throw new Error('No image generated');
    }
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}