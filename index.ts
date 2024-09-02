import express from 'express';
import multer from 'multer';
import sharp from 'sharp';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/combine-images', upload.array('images', 3), async (req, res) => {
  try {
    if (!req.files || req.files.length !== 3) {
      return res.status(400).json({ error: 'Please upload exactly 3 images.' });
    }

    const buffers = (req.files as Express.Multer.File[]).map(file => file.buffer);
    
    // Resize all images to a consistent size (e.g., 1000x1000 pixels)
    const resizedBuffers = await Promise.all(buffers.map(buffer => 
      sharp(buffer)
        .resize(1000, 1000, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toBuffer()
    ));
    
    const combinedImage = await sharp(resizedBuffers[0])
      .composite([
        { input: resizedBuffers[1], gravity: 'center' },
        { input: resizedBuffers[2], gravity: 'center' }
      ])
      .jpeg()
      .toBuffer();

    res.contentType('image/jpeg').send(combinedImage);
  } catch (error) {
    console.error('Error combining images:', error);
    res.status(500).json({ error: 'An error occurred while processing the images.' });
  }
});

app.use((req, res) => {
  res.status(404).send('Not Found');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});