const Product = require('../models/Product');
const { parseCSV } = require('../utils/csvParser');
const { imageQueue } = require('../queues/imageQueues');
const { v4: uuidv4 } = require('uuid');

// Upload CSV and process images
exports.uploadCSV = async (req, res) => {
  try {
    const { webhookURL } = req.body;
    const products = await parseCSV(req.body.csvFile); 
    // console.log({csvFile})

    // const products = await parseCSV(csvFile);
    console.log({products})

    const requestID = uuidv4();
    const newProduct = await Product.create({
      requestID,
      productName: products[0].productName,
      inputImageUrls: products[0].inputImageUrls,
      webhookURL,
      status: 'pending',
    });

    // Queue the processing task
    const job=await imageQueue.add('imageProcessingQueue', { requestID, products });
    console.log('Job added to queue:', job.id);
    res.status(200).json({
      requestID,
      message: 'Processing started.',
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error uploading CSV', error });
  }
};

// Status check for processing
exports.getStatus = async (req, res) => {
  try {
    const { requestID } = req.params;
    const product = await Product.findOne({ requestID });
    if (!product) {
      return res.status(404).json({ message: 'Request ID not found' });
    }
    res.status(200).json({
      requestID,
      status: product.status,
      outputImageUrls: product.outputImageUrls || [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching status', error });
  }
};
