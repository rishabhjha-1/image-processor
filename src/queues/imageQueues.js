const { Queue } = require('bullmq');

const imageQueue = new Queue('imageProcessingQueue', {
  connection: {
    host: 'redis-17349.c275.us-east-1-4.ec2.redns.redis-cloud.com',
    port: 17349,
    password: 'QgZJHL5HFpt4Ltwu9AuFvl7JnpL68PGg'
  }
});

module.exports = { imageQueue };
