const mongoose = require('mongoose');

async function updateAdmin() {
  await mongoose.connect('mongodb+srv://thuan120304:120304@cluster0.ybve5x3.mongodb.net/ev-rental?retryWrites=true&w=majority&appName=Cluster0');
  
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'admin@gmail.com' },
    { $set: { role: 'admin' } }
  );
  console.log('Updated admin:', JSON.stringify(result));
  
  const admin = await mongoose.connection.db.collection('users').findOne({ email: 'admin@gmail.com' });
  console.log('Admin user:', admin ? { name: admin.name, email: admin.email, role: admin.role, isVerified: admin.isVerified } : 'NOT FOUND');
  
  await mongoose.disconnect();
}

updateAdmin().catch(console.error);
