// utils/imageOptimizer.js

/**
 * Compress and resize image before upload
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width (default: 1200)
 * @param {number} maxHeight - Maximum height (default: 1200)
 * @param {number} quality - JPEG quality (0-1, default: 0.8)
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = async (
  file,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new file with the compressed blob
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              // Check if compression actually reduced size
              if (compressedFile.size < file.size) {
                resolve(compressedFile);
              } else {
                resolve(file); // Return original if compression didn't help
              }
            } else {
              reject(new Error("Canvas to Blob conversion failed"));
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("Image load failed"));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
};

/**
 * Batch compress multiple images
 * @param {File[]} files - Array of image files
 * @param {Object} options - Compression options
 * @returns {Promise<File[]>} Array of compressed files
 */
export const batchCompressImages = async (files, options = {}) => {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

  const compressionPromises = files.map((file) =>
    compressImage(file, maxWidth, maxHeight, quality).catch((error) => {
      console.error(`Failed to compress ${file.name}:`, error);
      return file; // Return original file if compression fails
    })
  );

  return Promise.all(compressionPromises);
};

/**
 * Generate thumbnail from image file
 * @param {File} file - Image file
 * @param {number} size - Thumbnail size (default: 150)
 * @returns {Promise<string>} Base64 thumbnail URL
 */
export const generateThumbnail = async (file, size = 150) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Calculate dimensions for square thumbnail
        const minDimension = Math.min(img.width, img.height);
        const sx = (img.width - minDimension) / 2;
        const sy = (img.height - minDimension) / 2;

        canvas.width = size;
        canvas.height = size;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw cropped square image
        ctx.drawImage(
          img,
          sx,
          sy,
          minDimension,
          minDimension,
          0,
          0,
          size,
          size
        );

        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };

      img.onerror = () => reject(new Error("Thumbnail generation failed"));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
};

/**
 * Preload images for better performance
 * @param {string[]} urls - Array of image URLs to preload
 * @returns {Promise<void>}
 */
export const preloadImages = async (urls) => {
  const promises = urls.map((url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error("Some images failed to preload:", error);
  }
};

/**
 * Get image dimensions from file
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>}
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    // Check if the file is an image
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image."));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = (error) => {
        reject(new Error("Failed to load image to get dimensions: " + error));
      };
      // event.target.result contains the base64 encoded image data
      img.src = event.target.result;
    };

    reader.onerror = (error) => {
      reject(new Error("Failed to read file to get dimensions: " + error));
    };

    // Read the file as a Data URL
    reader.readAsDataURL(file);
  });
};
