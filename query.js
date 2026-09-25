process.env.ENCRYPTION_KEY = '38e6789f2c8d4a5b9e12345678901234';
const mongoose = require('mongoose');
const fs = require('fs');

// Define User Schema so mongoose can decrypt
const AddressSchema = new mongoose.Schema({
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    zip: String,
    coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: [Number],
    },
}, { _id: false });

const { fieldEncryption } = require('mongoose-field-encryption');
AddressSchema.plugin(fieldEncryption, {
    fields: ['street', 'number', 'complement', 'neighborhood', 'city', 'state', 'zip', 'coordinates'],
    secret: process.env.ENCRYPTION_KEY
});

const PixConfigSchema = new mongoose.Schema({
    keyType: { type: String, default: 'CPF' },
    key: { type: String, default: '' },
    beneficiary: { type: String, default: '' },
    dynamicPix: { type: Boolean, default: false },
}, { _id: false });
PixConfigSchema.plugin(fieldEncryption, {
    fields: ['key', 'beneficiary', 'keyType'],
    secret: process.env.ENCRYPTION_KEY
});

const UserSchema = new mongoose.Schema({
    name: String,
    image: String,
    shopLogo: String,
    bannerImage: String,
    email: String,
    emailHash: String,
    role: String,
    cnpj: String,
    cpf: String,
    phone: String,
    whatsapp: String,
    address: AddressSchema,
    deliveryAddresses: [AddressSchema],
    rating: Number,
    reviewCount: Number,
}, { timestamps: true });

UserSchema.plugin(fieldEncryption, {
    fields: ['cnpj', 'cpf', 'phone', 'whatsapp', 'name', 'email'],
    secret: process.env.ENCRYPTION_KEY
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const MONGODB_URI = 'mongodb://localhost:27017/clickpet';

async function run() {
  let log = '';
  function print(msg) {
    console.log(msg);
    log += msg + '\n';
  }

  try {
    await mongoose.connect(MONGODB_URI);
    print('Connected to MongoDB');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    print('Collections in database: ' + collections.map(c => c.name).join(', '));

    // Fetch all users
    const users = await User.find({});
    print(`\nFound ${users.length} users in total:`);
    users.forEach(user => {
      print(`\n--- User ID: ${user._id} ---`);
      print(`Name (decrypted): ${user.name}`);
      print(`Role: ${user.role}`);
      print(`Email (decrypted): ${user.email}`);
      print(`Image: ${user.image}`);
      print(`ShopLogo: ${user.shopLogo}`);
      print(`BannerImage: ${user.bannerImage}`);
    });

    // Fetch all products
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    print(`\nFound ${products.length} products:`);
    products.forEach(p => {
      print(`- Product: ${p.name}, Image: ${p.image}`);
    });

  } catch (error) {
    print('Error: ' + error.stack);
  } finally {
    await mongoose.disconnect();
    fs.writeFileSync('query_result.txt', log);
  }
}

run();
