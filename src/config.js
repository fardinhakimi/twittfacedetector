const { join } = require('path')

module.exports = {

  twitterConfig: {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    token: process.env.TOKEN,
    token_secret: process.env.TOKEN_SECRET
  },

  images_path: join(__dirname, 'images'),
  processed_images_path: join(__dirname, 'public', 'processed_images')

}