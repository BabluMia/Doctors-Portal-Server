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
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("connect to dbDoctor");
    const serviceCollection = client
      .db("doctors_portal")
      .collection("services");
    const bookingCollection = client
      .db("doctors_portal")
      .collection("bookings");

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

    app.get('/available', async(req, res) =>{
      const date = req.query.date ;
     // || 'May 14, 2022'
      // step 1:  get all services
      const services = await serviceCollection.find().toArray();

      // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
      const query = {date: date};
      const bookings = await bookingCollection.find(query).toArray();

      // step 3: for each service
      services.forEach(service => {
        // step 4 :find bookings for that service
        const serviceBookings = bookings.filter(book => book.treatment === service.name )
        // step 5
        const bookedSlots = serviceBookings.map(book => book.slot)
        // step 6 : filter slots
        const available = service.slots.filter(slot => !bookedSlots.includes(slot)) 
        service.slots = available
      })
     

      res.send(services);
    })


    // app.get('/available', async(req, res) =>{
    //   const date = req.query.date || "May 15, 2022";

    //   // step 1:  get all services
    //   const services = await serviceCollection.find().toArray();

    //   // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
    //   const query = {date: date};
    //   const bookings = await bookingCollection.find(query).toArray();

    //   // step 3: for each service
    //   services.forEach(service=>{
       
    //     const serviceBookings = bookings.filter(book => book.treatment === service.name);
      
    //     const bookedSlots = serviceBookings.map(book => book.slot);
        
    //     const available = service.slots.filter(slot => !bookedSlots.includes(slot));
       
    //     service.slots = available;
    //   });
     

    //   res.send(services);
    // })

    // post booking
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        date: booking.date,
        patient: booking.patient,
      };
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({ success: true, result });
    });
  } finally {
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
