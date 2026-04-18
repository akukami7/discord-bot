import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://angelss:K5ndmQyVTNn4Fwbs@angelsbot.xt5ot4f.mongodb.net/?retryWrites=true&w=majority&appName=angelsbot';

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } catch(e) {
      console.error(e);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
