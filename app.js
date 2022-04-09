const cors = require("cors")
const express = require("express")
const mongoose = require("mongoose");
const bodyParser = require('body-parser')

const passport = require("passport");
const BasicStrategy = require("passport-http").BasicStrategy;

const dotenv = require('dotenv');
let dotenvExpand = require('dotenv-expand')
let env = dotenv.config()
dotenvExpand.expand(env)

const CONNECTION_STRING = process.env.CONNECTION_STRING
const PORT = process.env.PORT || 3001

mongoose.connect(CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Thread = require("./model/threads");
const Reply = require("./model/replies");
const Like = require("./model/likes");
const User = require("./model/users");
const { response } = require("express");
const { request } = require("express");
const { isRequired } = require("nodemon/lib/utils");

const app = express()


app.use('/healthcheck', require('./routes/healthcheck.js'));
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(bodyParser.json());

passport.use(new BasicStrategy((username, password, done) => done(null, {"username":"password", "nisse":"password"})));
app.use(passport.initialize());


passport.use(new BasicStrategy((username, password, done) => {
   User.findOne({username:username}, (error, user) => {
      if (error) return done(error);
      if (!user) return done(null, false);
      if (user.password !== password) return done(null, false);
      return done(null, user);
   });
}));


app.get("/", passport.authenticate('basic', {session: false}),(request, response)=>{
   response.set("http_status",200)
   response.set("cache-control",  "no-cache")
   response.set('Content-Type', 'application/json');
   body={"status": "available"}
   response.status(200).send(body)

   User.create
});

app.get("/thread", passport.authenticate('basic', {session: false}), (request, response) => {
   const thread = new Thread(request.body);
   thread.save((error, createdThread) => response.status(200).json(createdThread));
});

app.get("/threads", async (request, response)=>{
   // const threads = Thread.find().then((threads) => {
   //    response.json(threads)
   // })
   const threads = await Thread.find();
   response.json(threads);
})

app.post("/threads", async (request, response)=>{
   let thread = new Thread(request.body);
   thread.save();
   let ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress 
   console.log(ip);
   response.status(200).json(thread);
})

app.get("/threads/:id", async (request, response)=> {
   let thread;
   try {
      thread = await Thread.findById(request.params.id)
   } catch (e) {
      response.status(400).send("Bad request");
   }
   if (thread) {
      response.status(200).json(thread);
   } else {
      response.status(404).send("Thread not found!")
   }
});

app.get("/threads/:id/replies", async (request, response) => {
   let thread;
   try {
      thread = await Thread.findById(request.params.id)
   } catch (e) {
      response.status(400).send("Bad request");
   }
   if (thread.replies) {
      response.status(200).json(thread.replies);
   } else {
      response.status(404).send("Thread not found!")
   }
});

app.post("/threads/:id/replies", async(request, response)=> {
   let thread;
   try {
      thread = await Thread.findById(request.params.id)
   } catch (e) {
      response.status(400).send("Bad request");
   }

   if (thread) {
      request.body.time = new Date();
      const reply = new Reply(request.body);
      thread.replies.push(reply);
      await reply.save();
      await thread.save();
      response.status(201).end();
   } else {
      response.status(404).send("Thread not found!")
   }
})

app.post("/threads/:threadId/replies/:replyId/like", (request, response)=> {
   
})

app.delete("/threads/:threadId/replies/:replyId/like", (request, response)=> {
   console.log(request.params)
   body={"threadId":request.params.threadId, "replyId": request.params.replyId}
   response.status(200).send(body)
})


//curl -X POST http://localhost:3001/threads -H "Content-Type: application/json" -d "{\"title\":\"nisse\",\"content\":\"password\"}"
//Create
app.post("/users", (request, response) => {
   console.log(request.body)
   body={"threadId":request.params.threadId, "replyId":request.params.replyId}
   let user = new User(request.body)
   user.save()
   console.log(user);
   response.status(200).send(request.body)
})
app.get("/users", (request, response) => {
   User.find({}, (err, users) => {
      const userMap = {};
  
      users.forEach( async (user) => {
        userMap[user._id] = await user;
      });
  
      response.send(userMap);  
    });
})
app.get("/users/:id", (request, response)=> {
   console.log('ID:', request.params.id);
   try {
      user = User.findById(request.params.id)
   }catch (e) {
      console.error(e)
      response.status(400).send("Bad request")
   }
   if (user) {
      console.log(user);
      response.status(200).json(user)
   } else {
      response.status(404).send("Not found")
   }
})

app.delete("/users/:id", (request, response) => {
   try {
      User.deleteOne({ _id:request.params.id});
   } catch (e) {
      response.status(400).send("Bad request");
   }
   response.status(200).end();
});



app.listen(PORT , ()=>{
     console.log(`STARTED LISTENING ON PORT ${PORT}`)
})