// const csv = require('csv-parser');
// const fs = require('fs');

// const parseCSV = (filePath) => {
//   return new Promise((resolve, reject) => {
//     const products = [];
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on('data', (row) => {
//         products.push({
//           productName: row['Product Name'],
//           inputImageUrls: row['Input Image Urls'].split(','),
//         });
//       })
//       .on('end', () => resolve(products))
//       .on('error', (error) => reject(error));
//   });
// };

// module.exports = { parseCSV };
const csv = require('csv-parser');
const { Readable } = require('stream');

const parseCSV = (csvContent) => {
  return new Promise((resolve, reject) => {
    const products = [];

    // Check if csvContent is a string
    if (typeof csvContent !== 'string') {
      return reject(new Error('csvContent must be a string'));
    }

    // Create a readable stream from the CSV content
    const stream = Readable.from([csvContent]); // Wrap csvContent in an array to create an iterable

    stream
      .pipe(csv())
      .on('data', (row) => {
        products.push({
          productName: row['Product Name'],
          inputImageUrls: row['Input Image Urls'].split(','),
        });
      })
      .on('end', () => resolve(products))
      .on('error', (error) => reject(error));
  });
};

module.exports = { parseCSV };
