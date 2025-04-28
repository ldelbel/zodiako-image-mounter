import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Existing /combine-images endpoint (unchanged)
app.post('/combine-images', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length !== 5) {
      return res.status(400).json({ error: 'Please upload exactly 5 images.' });
    }

    const buffers = (req.files as Express.Multer.File[]).map(
      (file) => file.buffer
    );

    // Resize all images to a consistent size (e.g., 1000x1000 pixels)
    const resizedBuffers = await Promise.all(
      buffers.map((buffer) =>
        sharp(buffer)
          .resize(1000, 1000, {
            fit: 'cover',
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .toBuffer()
      )
    );

    const combinedImage = await sharp(resizedBuffers[0])
      .composite([
        { input: resizedBuffers[1], gravity: 'center' },
        { input: resizedBuffers[2], gravity: 'center' },
        { input: resizedBuffers[3], gravity: 'center' },
        { input: resizedBuffers[4], gravity: 'center' },
      ])
      .jpeg()
      .toBuffer();

    res.contentType('image/jpeg').send(combinedImage);
  } catch (error) {
    console.error('Error combining images:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while processing the images.' });
  }
});

// Existing / endpoint (unchanged)
app.get('/', async (req, res) => {
  try {
    const folderPath = path.join(__dirname, './images'); // Specify your local folder path
    const files = fs
      .readdirSync(folderPath)
      .filter((file) => /\.(jpg|jpeg|png|gif)$/.test(file)).sort(); // Filter for image files

    if (files.length !== 6) {
      return res
        .status(400)
        .json({
          error: 'Please ensure there are exactly 6 images in the folder.',
        });
    }

    const buffers = files.map((file) =>
      fs.readFileSync(path.join(folderPath, file))
    );

    // Resize all images to a consistent size (e.g., 1200x1200 pixels)
    const resizedBuffers = await Promise.all(
      buffers.map((buffer) =>
        sharp(buffer)
          .resize(1200, 1200, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .toBuffer()
      )
    );

    const resizedBuffer0 = await sharp(resizedBuffers[0])
      .resize(1200, 1200)
      .toBuffer();
    const resizedBuffer1 = await sharp(resizedBuffers[1])
      .resize(1100, 1100)
      .toBuffer();
    const resizedBuffer2 = await sharp(resizedBuffers[2])
      .resize(1200, 1200)
      .toBuffer();
    const resizedBuffer3 = await sharp(resizedBuffers[3])
      .resize(280, 280)
      .toBuffer();
    const resizedBuffer4 = await sharp(resizedBuffers[4])
      .resize(280, 280)
      .toBuffer();
    const resizedBuffer5 = await sharp(resizedBuffers[5])
      .resize(380, 380)
      .toBuffer();

    const combinedImage = await sharp(resizedBuffer0)
      .composite([
        { input: resizedBuffer1, gravity: 'center' },
        { input: resizedBuffer2, gravity: 'center' },
        { input: resizedBuffer3, top: 940, left: 710 },
        { input: resizedBuffer4, top: 940, left: 220 },
        { input: resizedBuffer5, top: 880, left: 450 },
      ])
      .jpeg()
      .toBuffer();

    res.contentType('image/jpeg').send(combinedImage);
  } catch (error) {
    console.error('Error combining images:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while processing the images.' });
  }
});

// New /resize-image endpoint
app.get('/resize-image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid image URL as a query parameter.' });
    }

    // Fetch the image from the URL
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(400).json({ error: `Failed to fetch image: ${response.status} ${response.statusText}` });
    }
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ error: `URL does not point to a valid image: Content-Type is ${contentType}` });
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    // Get image metadata to check dimensions
    const metadata = await sharp(buffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      return res.status(400).json({ error: 'Unable to determine image dimensions.' });
    }

    console.log(`Original dimensions for image at ${url}: ${width}x${height}`);

    // Check if resizing is needed
    if (width <= 2048 && height <= 2048) {
      // No resizing needed, return the original image
      res.contentType(contentType).send(buffer);
      return;
    }

    // Calculate the scaling factor to fit within 2048x2048 while maintaining proportions
    const maxDimension = Math.max(width, height);
    const scaleFactor = 2048 / maxDimension;
    const newWidth = Math.round(width * scaleFactor);
    const newHeight = Math.round(height * scaleFactor);

    console.log(`Resizing image to: ${newWidth}x${newHeight}`);

    // Resize the image
    const resizedBuffer = await sharp(buffer)
      .resize(newWidth, newHeight, {
        fit: 'inside', // Maintain aspect ratio, ensure image fits within dimensions
        withoutEnlargement: true, // Prevent upscaling
      })
      .jpeg() // Convert to JPEG for consistency with PiAPI requirements
      .toBuffer();

    res.contentType('image/jpeg').send(resizedBuffer);
  } catch (error) {
    console.error('Error resizing image:', error);
    res.status(500).json({ error: 'An error occurred while resizing the image.' });
  }
});

app.use((req, res) => {
  res.status(404).send('Not Found');
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});