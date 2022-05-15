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
// jwt token
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

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
    const userCollection = client.db("doctors_portal").collection("users");

    /**
     * API naming convention
     * app.get('/booking) // get all booking from collection or one by filter
     * app.get('/booking/:id) // get a speacfic booking by id
     * app.post('/booking) // add a new booking
     * app.patch('/booking/:id) // update a speacfic booking
     * app.put('/user/:id') // thakle update na thalke create
     * app.delete('/booking/:id) // delete a speacfic booking
     */

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    // all user
    app.get('/user',verifyJWT, async(req,res)=>{
      const users = await userCollection.find().toArray()
      res.send(users)

    })
    // admin role
    app.put("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: {role:'admin'},
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      
      res.send(result);
    });
    // user collection
    app.put("/user/:email",verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "8h" }
      );
      res.send({ result, token });
    });

    app.get("/available", async (req, res) => {
      const date = req.query.date;
      // || 'May 14, 2022'
      // step 1:  get all services
      const services = await serviceCollection.find().toArray();

      // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();

      // step 3: for each service
      services.forEach((service) => {
        // step 4 :find bookings for that service
        const serviceBookings = bookings.filter(
          (book) => book.treatment === service.name
        );
        // step 5
        const bookedSlots = serviceBookings.map((book) => book.slot);
        // step 6 : filter slots
        const available = service.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        service.slots = available;
      });

      res.send(services);
    });
    // load user data
    app.get("/booking", verifyJWT, async (req, res) => {
      const patient = req.query.patient;
      const authorization = req.headers.authorization;
      const decodedEmail = req.decoded.email;
      if (patient === decodedEmail) {
        const query = { patient: patient };
        const bookings = await bookingCollection.find(query).toArray();
        res.send(bookings);
      }
      else{
        return res.status(403).send({ message: "Forbidden access" });
      }
      
    });

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
