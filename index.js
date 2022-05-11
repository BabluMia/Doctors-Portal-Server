const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
require("dotenv").config();

// middlewere
app.use(express.json());
app.use(cors());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.USER_PASS}@cluster0.qlagt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run (){
    try{
      await client.connect();
      console.log("connect to dbDoctor");
      const serviceCollection = client.db("doctors_portal").collection("services");
      app.get("/services", async (req, res) => {
        const query = {};
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
      });
    }
    finally{

    }
}



// call run function
run().catch(console.dir);

// test server home route
app.get("/", (req, res) => {
  res.send("Doctors Server Conected . Test Done!!");
});
// listening port
app.listen(port, () => {
  console.log("Doctors Surver Running In", port);
});