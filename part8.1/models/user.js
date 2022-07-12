const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 2,
  },
  favouriteGenre: {
    type: String,
    minlength: 2,
  },
});

module.exports = mongoose.model('User', userSchema);
