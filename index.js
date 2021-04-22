const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongodb = require("mongodb");
const URL="mongodb+srv://laxmiprasanna:prasanna123@cluster0.1crhq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const DB = "urlshortner";
const bcrypt = require("bcryptjs");
const jwt =require("jsonwebtoken");
require('dotenv').config();


app.use(express.json());
app.use(cors());

function generateUrl() {
    var randNum = "";
    var char = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890";
    var charlen = char.length;

    for (var i = 0; i < 5; i++) {
        randNum += char.charAt(
            Math.floor(Math.random() * charlen)
        );
    }
    return randNum;
}




app.get("/create", async function (req, res) {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let url = await db.collection("url").find().toArray();
        res.json(url)
        await connection.close();
        res.redirect(url.longurl)
    } catch (error) {
        console.log(error)
    }
})

app.post("/create",async function (req, res) {
    try {
        req.body.shorturl= generateUrl();
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        await db.collection("url").insertOne(req.body);
        await connection.close();

        res.json({
            message: "url created"
        })
    } catch (error) {
        console.log(error)
    }
})

app.get("/:id", async (req, res) => {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        db.collection("url").findOne({ shorturl: req.params.id }, (err, data) => {
            if (err) {
                throw err;
            }
            else {
            res.redirect(data.longurl)
            }
        })
        await connection.close();
    } catch (error) {
        console.log(error)
    }
})


app.post("/register", async function (req, res) {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);

        let uniqueEmail = await db.collection("users").findOne({ email: req.body.email });

        if (uniqueEmail) {
            res.status(401).json({
                message: "email already exist"
            })
        } else {
            let salt = await bcrypt.genSalt(10);

            let hash = await bcrypt.hash(req.body.password, salt);

            req.body.password = hash;

            let users = await db.collection("users").insertOne(req.body);

            await connection.close();
            res.json({
                message: "User Registerd"
            })
        }
    } catch (error) {
        console.log(error)
    }
})

app.post("/login", async function (req, res) {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);

        let user = await db.collection("users").findOne({ email: req.body.email })

        if (user) {
            let isPassword = await bcrypt.compare(req.body.password, user.password);
            if (isPassword) {

                let token=jwt.sign({_id:user._id},process.env.secret)

                res.json({
                    message: "allow",
                    token,
                    id:user._id
                })
            } else {
                res.status(404).json({
                    message: "Email or password is incorrect"
                })
            }
        } else {
            res.status(404).json({
                message: "Email or password is incorrect"
            })
        }
    } catch (error) {
        console.log(error)
    }
})

app.get("/userurl/:id", async function (req, res) {
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let movies =await db.collection("url").find({email:req.params.id}).toArray();
        res.json(movies)
        await connection.close();
    } catch (error) {
        console.log(error)
    }
})




app.listen(process.env.PORT|| 5000, () => {
    console.log("server is running on 5000");
})