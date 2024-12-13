import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

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

    // Resize all images to a consistent size (e.g., 1000x1000 pixels)
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
      .resize(1200, 1200) // Example new size for buffer 1
      .toBuffer();
    // Resize specific buffers
    const resizedBuffer1 = await sharp(resizedBuffers[1])
      .resize(1100, 1100) // Example new size for buffer 1
      .toBuffer();

    const resizedBuffer2 = await sharp(resizedBuffers[2])
      .resize(1200, 1200) // Example new size for buffer 2
      .toBuffer();

    const resizedBuffer3 = await sharp(resizedBuffers[3])
      .resize(280, 280) // Example new size for buffer 3
      .toBuffer();

    const resizedBuffer4 = await sharp(resizedBuffers[4])
      .resize(280, 280) // Example new size for buffer 4
      .toBuffer();

    const resizedBuffer5 = await sharp(resizedBuffers[5])
      .resize(380, 380) // Example new size for buffer 4
      .toBuffer();

    const combinedImage = await sharp(resizedBuffer0)
      .composite([
        { input: resizedBuffer1, gravity: 'center' },
        { input: resizedBuffer2, gravity: 'center' },
        {
          input: resizedBuffer3,
          top: 940,
          left: 710,
        },
        {
          input: resizedBuffer4,
          top: 940,
          left: 220,
        },
        {
          input: resizedBuffer5,
          top: 880,
          left: 450,
        },
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

app.use((req, res) => {
  res.status(404).send('Not Found');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});