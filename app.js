// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const qr = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint to generate QR code
app.post('/generate-qr', async (req, res) => {
  try {
    const { text, url, center } = req.body;

    if (!text || !url) {
      return res.status(400).json({ message: 'Both "text" and "url" are required to generate QR code' });
    }

    // QR code options
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300, // Set size of the QR code
    };

    // Generate QR code data URL
    const qrCodeDataURL = await qr.toDataURL(url, qrOptions);

    // Create a canvas with enough height for logo, Yaba text, QR codes, title, and URL
    const canvas = createCanvas(1000, 650); // Width 1000px, Height 650px
    const ctx = canvas.getContext('2d');

    // Fill background with a soft teal-blue for modern appeal
    ctx.fillStyle = '#d4e6ed'; // Soft teal-blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the first QR code on the left
    const qrCodeImage = await loadImage(qrCodeDataURL);

    // Load and draw the communion logo at the top center (circular clip)
    const logo = await loadImage('./comms-image.jpg');
    const logoSize = 120; // diameter of the circular logo
    const logoX = canvas.width / 2;
    const logoY = 20 + logoSize / 2; // center Y of the circle

    // Save context, clip to circle, draw logo, restore
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, logoX - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);
    ctx.restore();

    // Add center text below the logo (dynamic, defaults to empty)
    if (center) {
      ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText(center, canvas.width / 2, logoY + logoSize / 2 + 25);
    }

    // Shift QR codes down to avoid overlapping the logo and Yaba text
    const qrY = logoY + logoSize / 2 + 50;

    // Draw the first QR code on the left
    ctx.drawImage(qrCodeImage, 150, qrY, 300, 300); // Position QR code (x, y, width, height)

    // Draw the second QR code on the right
    ctx.drawImage(qrCodeImage, 550, qrY, 300, 300); // Position QR code (x, y, width, height)

    // Compute text positions relative to the QR bottom
    const captionY = qrY + 300 + 40; // more space below QR codes

    // Add the URL below both QR codes
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#333'; // Dark text color for readability
    ctx.textAlign = 'center';
    ctx.fillText(url, canvas.width / 2, captionY + 35); // Text centered below both QR codes

    // Add main centralized text above the URL
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.fillText(text, canvas.width / 2, captionY);

    // Save the final image
    const filePath = `./qrcodes/qr-${Date.now()}.png`;
    const out = fs.createWriteStream(filePath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on('finish', () => {
      // Send the file as a download
      res.download(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ message: 'Error generating QR code' });
        }

        // Clean up: delete the file after download
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
