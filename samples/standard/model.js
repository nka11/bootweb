var bootweb = require("bootweb"),
  fs = require("fs"),
  logger = bootweb.getLogger('Sample'),
  Schema = bootweb.mongoose.Schema,
  ObjectId = Schema.ObjectId,
  Sample = new Schema({
    name: {
      type: String,
      required: true,
      index: {
        sparse: true
      }
    },
    description: {
      type: String
    }
  });
  
bootweb.mongoose.model('Sample', Sample); // register the sample model