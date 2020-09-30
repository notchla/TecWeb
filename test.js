
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://user:TecWeb@cluster0.rbdoz.mongodb.net/sample_geospatial?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology:true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  console.log("connected")
  client.close();
});
