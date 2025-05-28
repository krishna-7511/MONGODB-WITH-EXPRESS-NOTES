const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const Chat = require("./models/chat.js");
const methodOverride = require("method-override");
const ExpressError = require("./ExpressError");
const { nextTick } = require("process");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

main()
  .then((res) => {
    console.log("Connection Established!");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/whatsapp");
}

// Index Route
app.get("/chats", async (req, res) => {
  let chats = await Chat.find();
  // console.log(chats);
  res.render("index.ejs", { chats });
});

// new Route
app.get("/chats/new", (req, res) => {
  res.render("new.ejs");
});

//create route
app.post("/chats", asyncWrap(async(req, res,next) => {
  let { from, to, msg } = req.body;
  let newChat = new Chat({
    from: from,
    to: to,
    msg: msg,
    created_at: new Date(),
  });
  await newChat.save();
  res.redirect("/chats");
}));

// Edit Route
app.get("/chats/:id/edit",asyncWrap(async (req, res,next) => {
  let { id } = req.params;
  let chat = await Chat.findById(id);
  // if(!chat){
  //   next(new ExpressError(500,"Chat not found"));
  // }
  res.render("edit.ejs", { chat });
}));

// wrapAsync
function asyncWrap(fn){
  return function(req,res,next){
    fn(req,res,next).catch((err)=>next(err));
  }
};

// SHow route
app.get("/chats/:id",asyncWrap (async (req, res,next) => {
  let { id } = req.params;
  let chat = await Chat.findById(id);
  if(!chat){
    next(new ExpressError(500,"Chat not found"));
  }
  res.render("edit.ejs", { chat });
}));

// Update Route
app.put("/chats/:id", asyncWrap(async(req, res) => {
  let { id } = req.params;
  let { msg: newMsg } = req.body;
  let updatedChat = await Chat.findByIdAndUpdate(
    id,
    { msg: newMsg },
    { runValidators: true,new: true }
  );
  // console.log(updatedChat);
  res.redirect("/chats");
}));

// Destry Route
app.delete("/chats/:id",asyncWrap(async (req,res)=>{
  let {id} = req.params;
  let deletedChat = await Chat.findByIdAndDelete(id);
  // console.log(deletedChat);
  res.redirect("/chats");
}));

// handle Validation error
const handleValidationError = (err)=>{
  console.log("This is a Validation Error. Please follow rules");
  console.dir(err.message);
  return err;
}


//error handler call 
app.use((err,req,res,next)=>{
  console.log(err.name);
  if(err.name ==="ValidationError"){
    err = handleValidationError(err);
  }
  next(err);
});

//then
//error handling middleware
app.use((Err,req,res,next)=>{
  let {status=500,message="Some error occured"} = Err;
  res.status(status).send(message);
})

app.get("/", (req, res) => {
  res.send("root is working");
});

app.use((req, res) => {
  res.status(404).send("404 Not Found - No matching route.");
});


app.listen(8080, () => {
  console.log("server is listening on port 8080");
});

/*  order wise


// 1. Import all required modules
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");

const Chat = require("./models/chat.js");  // Your Mongoose model
const ExpressError = require("./ExpressError");  // Custom error class

// 2. Initialize express app
const app = express();

// 3. Setup view engine and views folder
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 4. Setup static folder for CSS, JS, images, etc.
app.use(express.static(path.join(__dirname, "public")));

// 5. Parse incoming request bodies (form data)
app.use(express.urlencoded({ extended: true }));

// 6. Override HTTP methods to support PUT and DELETE via forms
app.use(methodOverride("_method"));

// 7. Async wrapper to catch errors in async route handlers
function asyncWrap(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(next); // Pass errors to Express error handlers
  };
}

// 8. Connect to MongoDB with mongoose
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/whatsapp");
}
main()
  .then(() => {
    console.log("MongoDB Connection Established!");
  })
  .catch((err) => console.log("MongoDB Connection Error:", err));

// ---------------------------------------
// ROUTES
// ---------------------------------------

// 9. Root route - simple test
app.get("/", (req, res) => {
  res.send("Root is working");
});

// 10. Index Route - Show all chats
app.get(
  "/chats",
  asyncWrap(async (req, res) => {
    const chats = await Chat.find();
    res.render("index.ejs", { chats });
  })
);

// 11. New Chat Form Route
app.get("/chats/new", (req, res) => {
  res.render("new.ejs");
});

// 12. Create Chat Route - Create new chat document in DB
app.post(
  "/chats",
  asyncWrap(async (req, res) => {
    const { from, to, msg } = req.body;
    const newChat = new Chat({
      from,
      to,
      msg,
      created_at: new Date(),
    });
    await newChat.save();
    res.redirect("/chats");
  })
);

// 13. Edit Chat Form Route - Show form to edit a chat
app.get(
  "/chats/:id/edit",
  asyncWrap(async (req, res, next) => {
    const { id } = req.params;
    const chat = await Chat.findById(id);
    if (!chat) {
      return next(new ExpressError(404, "Chat not found"));
    }
    res.render("edit.ejs", { chat });
  })
);

// 14. Show Single Chat Route - Show details of one chat
app.get(
  "/chats/:id",
  asyncWrap(async (req, res, next) => {
    const { id } = req.params;
    const chat = await Chat.findById(id);
    if (!chat) {
      return next(new ExpressError(404, "Chat not found"));
    }
    // You can render a show.ejs if you want separate page; here reused edit.ejs
    res.render("edit.ejs", { chat });
  })
);

// 15. Update Chat Route - Update chat document with new message
app.put(
  "/chats/:id",
  asyncWrap(async (req, res, next) => {
    const { id } = req.params;
    const { msg } = req.body;
    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      { msg },
      { runValidators: true, new: true }
    );
    if (!updatedChat) {
      return next(new ExpressError(404, "Chat not found"));
    }
    res.redirect("/chats");
  })
);

// 16. Delete Chat Route - Delete chat from DB
app.delete(
  "/chats/:id",
  asyncWrap(async (req, res, next) => {
    const { id } = req.params;
    const deletedChat = await Chat.findByIdAndDelete(id);
    if (!deletedChat) {
      return next(new ExpressError(404, "Chat not found"));
    }
    res.redirect("/chats");
  })
);
// ---------------------------------------
// ERROR HANDLING MIDDLEWARE
// ---------------------------------------

// 17. Handle Mongoose Validation Errors
const handleValidationError = (err) => {
  console.log("Validation Error Detected:");
  console.dir(err.message);
  return err;
};

// 18. General error handler middleware - logs errors and responds with message
app.use((err, req, res, next) => {
  console.error(err.name, err.message);
  if (err.name === "ValidationError") {
    err = handleValidationError(err);
  }
  const { status = 500, message = "Something went wrong!" } = err;
  res.status(status).send(message);
});

// 19. 404 Not Found handler - if no route matched
app.use((req, res) => {
  res.status(404).send("404 Not Found - No matching route.");
});

// ---------------------------------------
// START SERVER
// ---------------------------------------
app.listen(8080, () => {
  console.log("Server listening on port 8080");
});

    
   
*/