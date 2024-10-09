const axios = require('axios');

const sendWebhook = async (webhookURL, payload) => {
  try {
    await axios.post(webhookURL, payload);
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
};

module.exports = { sendWebhook };
