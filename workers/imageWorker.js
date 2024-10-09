const { Worker } = require('bullmq');
const Product = require('../src/models/Product');
const cloudinary = require('../src/config/cloudinary');
const sharp = require('sharp');
const { sendWebhook } = require('../src/utils/webhookHandler');

const imageWorker = new Worker('imageProcessingQueue', async (job) => {
    console.log("called")
  const { requestID, products } = job.data;
console.log({requestID})
  try {
    const product = await Product.findOne({ requestID });
    if (!product) throw new Error('Product not found');

    // Set status to "in-progress"
    product.status = 'in-progress';
    await product.save();

    const outputImageUrls = [];
    
    // Process each image
    for (const imageUrl of product.inputImageUrls) {
      const imageBuffer = await sharp({ url: imageUrl }).resize(500).toBuffer();
      const result = await cloudinary.uploader.upload_stream(imageBuffer);

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
  }
});

module.exports=imageWorker