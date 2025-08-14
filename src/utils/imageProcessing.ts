import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 512;

interface ImageProcessingOptions {
  width: number;
  height: number;
  removeBackground?: boolean;
  fit?: 'cover' | 'contain' | 'fill';
}

export const processImageForCard = async (
  imageFile: File | Blob,
  options: ImageProcessingOptions
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        // Set canvas size to card dimensions
        canvas.width = options.width;
        canvas.height = options.height;

        // Calculate scaling and positioning
        const scale = options.fit === 'contain' 
          ? Math.min(options.width / img.width, options.height / img.height)
          : options.fit === 'cover'
          ? Math.max(options.width / img.width, options.height / img.height)
          : 1;

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        const x = (options.width - scaledWidth) / 2;
        const y = (options.height - scaledHeight) / 2;

        // Fill background with transparent for PNG or white for JPEG
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, options.width, options.height);

        // Draw the image
        if (options.fit === 'fill') {
          ctx.drawImage(img, 0, 0, options.width, options.height);
        } else {
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        }

        // Remove background if requested
        if (options.removeBackground) {
          try {
            const processedBlob = await removeBackground(canvas);
            const processedImg = await loadImageFromBlob(processedBlob);
            
            // Clear canvas and redraw processed image
            ctx.clearRect(0, 0, options.width, options.height);
            ctx.drawImage(processedImg, x, y, scaledWidth, scaledHeight);
          } catch (error) {
            console.warn('Background removal failed, using original image:', error);
          }
        }

        resolve(canvas.toDataURL('image/png', 0.9));
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
};

const removeBackground = async (canvas: HTMLCanvasElement): Promise<Blob> => {
  try {
    console.log('Starting background removal...');
    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512');
    
    // Convert canvas to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Process the image
    const result = await segmenter(imageData);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Invalid segmentation result');
    }
    
    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Apply mask
    const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const data = outputImageData.data;
    
    for (let i = 0; i < result[0].mask.data.length; i++) {
      const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
      data[i * 4 + 3] = alpha;
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

const loadImageFromBlob = (blob: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
};

export const resizeImageForCard = async (file: File): Promise<string> => {
  return processImageForCard(file, {
    width: 378, // 10cm in pixels (~96 DPI)
    height: 265, // 7cm in pixels (~96 DPI)
    fit: 'cover'
  });
};