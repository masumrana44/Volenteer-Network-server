const express = require("express");
const cors = require("cors");
const colors = require("colors");
const dotenv = require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { decode } = require("punycode");
const app = express();
const port = process.env.PORT || 5000;

// MiddleWare
app.use(cors());
app.use(express.json());

// jwt Verification Middleware
// const verifyJWT = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).send({ meassage: "unauthorized access" });
//   }
//   const token = authHeader.split(" ")[1];
//   jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded)=>{
//     if(err){
//       return res.status(401).send({message:"unauthorized access"});
//     }
//        req.decoded=decoded;
//  return next()
//   })

// };

function verifyJWT(req, res, next) {
  const authHeader=req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:'unauthorized access'})
  }

  const token=authHeader.split(' ')[1];
   jwt.verify(token,process.env.ACCESS_TOKEN,function(err,decoded){
    if(err){
      return res.status(401).send({message:'unauthorized access'})
    }
    req.decoded=decoded;
     next()
   })

  // console.log(authHeader)
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.w9y9xep.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    const eventCollection = client.db("Event-Collection").collection("events");
    const donationCollection = client
      .db("Donation-Collection")
      .collection("DonationStory");

    // for wtw token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // Posting Data  Mongodb server form Client site
    app.post("/add/event", async (req, res) => {
      const event = req.body;
      const result = await eventCollection.insertOne(event);
      res.send(result);
    });

    // Posting Donation story in Mongodb Database
    app.post("/posting/donate", async (req, res) => {
      const donateData = req.body;
      const result = donationCollection.insertOne(donateData);
      res.send(result);
    });

    // Geting Data from MOngodb Database to Client site
    app.get("/events", async (req, res) => {
      const query = {};
      const cursor = eventCollection.find(query);
      const events = await cursor.toArray();
      res.send(events);
    });

    // Geting a single data from Mongodb Database

    app.get("/event/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const event = await eventCollection.findOne(query);
      res.send(event);
    });

    app.get("/donation",verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decoded=req.decoded;
      if(decoded.email !==email){
        req.status(403).send({message:'unauthorized access'})
      } 
      let query = {};
      if (req.query) {
        query = {
          email: email,
        };
      }
      const cursor = donationCollection.find(query);
      const events = await cursor.toArray();
      res.send(events);
    });

    app.delete("/delete/donation/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationCollection.deleteOne(query);
      res.send(result);
    });
  } catch {
  } finally {
  }
};

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Volenteer Server is Running Right now");
});

app.listen(port, () => {
  console.log(`The volenteer server is running on port ${port}`.bgCyan);
});
