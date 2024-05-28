const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const fs = require('fs');
const fileUpload = require('express-fileupload');
const { error, log } = require('console');
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());
app.use(express.static('users'));
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yxeyv01.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server (optional starting in v4.7)
        // await client.connect();

        const database = client.db("UserPhotos");
        const userCollection = database.collection("users");

        app.post("/users", async (req, res) => {
            const name = req.body.name;
            const image = req.files.image;
            image.mv(`${__dirname}/users/${image.name}`, error => {
                if (error) {
                    console.log(error);
                    res.status(500).send({ error });
                }
            });
            const userData = {
                name: name,
                imagePath: `/${image.name}`
            }
            const result = await userCollection.insertOne(userData);
            res.send(result);
        });

        app.get("/users", async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const user = await userCollection.findOne(query);
            const imgServerPath = `${__dirname}/users/${user.imagePath}`;

            // delete file
            fs.unlink(imgServerPath, error => {
                console.log(error);
            })

            const result = await userCollection.deleteOne(query);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Image Uploading Server is running');
});

app.listen(port, () => {
    console.log(`Image Uploading Server is running on port ${port}`);
});