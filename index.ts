import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

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
            fit: 'contain',
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
      .filter((file) => /\.(jpg|jpeg|png|gif)$/.test(file)); // Filter for image files

    if (files.length !== 5) {
      return res
        .status(400)
        .json({
          error: 'Please ensure there are exactly 5 images in the folder.',
        });
    }

    const buffers = files.map((file) =>
      fs.readFileSync(path.join(folderPath, file))
    );

    // Resize all images to a consistent size (e.g., 1000x1000 pixels)
    const resizedBuffers = await Promise.all(
      buffers.map((buffer) =>
        sharp(buffer)
          .resize(1000, 1000, {
            fit: 'contain',
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

app.use((req, res) => {
  res.status(404).send('Not Found');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
