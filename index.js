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
      const bookingCollection = client.db("doctors_portal").collection("bookings");

      /**
       * API naming convention
       * app.get('/booking) // get all booking from collection or one by filter
       * app.get('/booking/:id) // get a speacfic booking by id 
       * app.post('/booking) // add a new booking 
       * app.patch('/booking/:id) // update a speacfic booking 
       * app.delete('/booking/:id) // delete a speacfic booking 
        */
      
      app.get("/services", async (req, res) => {
        const query = {};
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
      });

      // post booking
      app.post('/booking' , async(req,res) =>{
          const booking = req.body;
          const query = {treatment :booking.treatment , date: booking.date , patient:booking.patient}
          const result = await bookingCollection.insertOne(booking);
          res.send(result);
      })
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