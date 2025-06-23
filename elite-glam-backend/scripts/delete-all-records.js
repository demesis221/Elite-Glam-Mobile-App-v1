// Script to delete all records from all collections (but NOT drop the database itself)
require('dotenv').config();
const mongoose = require('mongoose');

async function deleteAllRecords() {
  await mongoose.connect(process.env.MONGODB_URI);
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    const result = await collection.deleteMany({});
    console.log(`Deleted ${result.deletedCount} documents from ${collection.collectionName}`);
  }

  await mongoose.disconnect();
  console.log('All records deleted from all collections (database structure preserved).');
}

deleteAllRecords().catch(err => {
  console.error('Error deleting records:', err);
  process.exit(1);
});
