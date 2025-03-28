const express = require('express')
const app = express()
const cors = require("cors")
require("dotenv").config()

const port = process.env.PORT || 4000;

// middleware
app.use(express.json());
app.use(cors());

// MongoDB setup
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_URL}:${process.env.DB_PASSWORD}@job.gwxncya.mongodb.net/?retryWrites=true&w=majority&appName=job`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const db = client.db("mernJobportal");
    const jobcollection = db.collection("demojob");
    const usercollection = db.collection("users");  // New collection for users

    // Post a new job
    app.post("/post-job", async(req, res) => {
      const body = req.body;
      body.creatAt = new Date();

      const result = await jobcollection.insertOne(body);

      if(result.insertedId) {
        return res.status(200).send(result);
      } else {
        return res.status(404).send({
          message: "Can't insert! Try again later",
          status: false
        });
      }
    });

    // Create a new user
    app.post("/create-user", async(req, res) => {
      const user = req.body;

      // Check if user already exists
      const existingUser = await usercollection.findOne({ email: user.email });
      if (existingUser) {
        return res.status(400).send({
          message: "User already exists",
          status: false
        });
      }

      // Insert new user
      const result = await usercollection.insertOne(user);

      if(result.insertedId) {
        return res.status(200).send({
          message: "User created successfully",
          status: true,
          userId: result.insertedId
        });
      } else {
        return res.status(500).send({
          message: "Error creating user. Try again later",
          status: false
        });
      }
    });

    // Get all jobs
    app.get("/all-jobs", async(req, res) => {
      const jobs = await jobcollection.find({}).toArray();
      res.send(jobs);
    });

    // Get job by ID
    app.get("/all-jobs/:id", async(req, res) => {
      const id = req.params.id;
      const job = await jobcollection.findOne({_id: new ObjectId(id)});
      res.send(job);
    });

    // Update job by ID
    app.patch("/update-job/:id", async(req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      const filter = {_id: new ObjectId(id)};
      const options = { upsert: true };
      const updateData = {
        $set: {
          ...jobData
        }
      };
      const result = await jobcollection.updateOne(filter, updateData, options);
      res.send(result);
    });

    // Get jobs posted by a specific user
    app.get("/myJobs/:email", async(req, res) => {
      const jobs = await jobcollection.find({postedBy: req.params.email}).toArray();
      res.send(jobs);
    });

    // Delete a job by ID with condition
    app.delete("/job/:id", async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};

      // Check if the job exists before trying to delete it
      const job = await jobcollection.findOne(filter);

      if (!job) {
        return res.status(404).send({
          message: "Job not found",
          status: false
        });
      }

      const result = await jobcollection.deleteOne(filter);

      if (result.deletedCount === 1) {
        res.status(200).send({
          message: "Job deleted successfully",
          status: true
        });
      } else {
        res.status(500).send({
          message: "Failed to delete the job",
          status: false
        });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

// Default route
app.get('/', (req, res) => {
  res.send('Hello Developers!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
