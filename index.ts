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
    
    const combinedImage = await sharp(buffers[0])
      .composite([
        { input: buffers[1], gravity: 'center' },
        { input: buffers[2], gravity: 'center' }
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