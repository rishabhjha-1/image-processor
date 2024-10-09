const { Worker } = require('bullmq');
const Product = require('../src/models/Product');
const cloudinary = require('../src/config/cloudinary');
const sharp = require('sharp');
const { sendWebhook } = require('../src/utils/webhookHandler');
const https = require('https');

const fetchImage = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error(`Failed to load image, status code: ${response.statusCode}`));
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
};

const imageWorker = new Worker('imageProcessingQueue', async (job) => {
  console.log("called")
  const { requestID } = job.data;
  console.log({requestID})
  try {
    const product = await Product.findOne({ requestID });
    console.log({product})
    if (!product) throw new Error('Product not found');

    // Set status to "in-progress"
    product.status = 'in-progress';
    await product.save();

    const outputImageUrls = [];
    
    // Process each image
    for (const imageUrl of product.inputImageUrls) {
      console.log({imageUrl})
      // Fetch the image
      const buffer = await fetchImage(imageUrl);

      // Process the image with Sharp
      const processedBuffer = await sharp(buffer).resize(500).toBuffer();

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream((error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(processedBuffer);
      });

      outputImageUrls.push(result.secure_url);
    }
    console.log({outputImageUrls})

    // Update product with output images and status
    product.outputImageUrls = outputImageUrls;
    product.status = 'completed';
    await product.save();

    // Send webhook if provided
    if (product.webhookURL) {
      await sendWebhook(product.webhookURL, {
        requestID: product.requestID,
        status: 'completed',
        outputImageUrls: product.outputImageUrls,
      });
    }

  } catch (error) {
    console.error('Error processing job:', error);
    // Update product status to 'failed' if an error occurs
    if (product) {
      product.status = 'failed';
      await product.save();
    }
  }
}, {
  connection: {
    host: 'redis-17349.c275.us-east-1-4.ec2.redns.redis-cloud.com',
    port: 17349,
    password: 'QgZJHL5HFpt4Ltwu9AuFvl7JnpL68PGg'
  }
});

module.exports = imageWorker;