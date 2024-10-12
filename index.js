const Express = require("express");
const Cookie = require("cookie-parser");
const JWT = require("jsonwebtoken");
const Bcrypt = require("bcrypt");
const Path = require("path");
const App = Express();
const UserModel = require("./Models/UserModel.model");
const PostModel = require("./Models/PostModel.js");
App.set("view engine", "ejs");
App.use(Express.static(Path.join(__dirname, "Public")));
App.use(Express.json());
App.use(Express.urlencoded({ extended: true }));
App.use(Cookie());

// Note - >  Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.MyToken;
 
  
  if (!token) return res.sendStatus(401); //NOTE - > Status Code

  JWT.verify(token, "Key", async (err, user) => {
    if (err) return res.sendStatus(403); //NOTE - > Status Code
    req.user = user; //Note - >  Create Any Name Of Variable (user)
    next();
  });
};

App.get("/", (req, res) => {
  res.render("Home");
});

App.get("/login", (req, res) => {
  res.render("LoginPage");
 
  
});

App.get("/logout", (req, res) => {
  res.cookie("MyToken", "");
  res.redirect("/login");
});

App.get("/profile", authenticateToken, async (req, res) => {
  //Note - >  That'S How Use Middleware

  const FindUser = await UserModel.findOne({ Email: req.user.Email });
  if (!FindUser) return res.send("User not found");

  const userPosts = await PostModel.find({ userId: FindUser._id });

  res.render("ProfilePage", {
    UserName: FindUser.UserName,
    Email: FindUser.Email,
    Posts: userPosts,
  });
});

App.get("/user", async (req, res) => {
  let FindUser = await UserModel.find();
  res.render("Show", { Users: FindUser });
});

App.get("/create-post", async (req, res) => {
  res.render("CreatePost");
});
App.get("/delete/:Id", async (req, res) => {
  let Delete = await PostModel.findOneAndDelete({ _id: req.params.Id });
  res.redirect("/profile");
});

App.get("/edit/:Id", async (req, res) => {
  let Users = await PostModel.findOne({ _id: req.params.Id });
  res.render("Edit", { Users });
});

App.post("/login", async (req, res) => {
  let FindUser = await UserModel.findOne({ Email: req.body.Email });
  if (!FindUser) return res.send("Something Went Wrong");

  Bcrypt.compare(req.body.PassWord, FindUser.PassWord, (err, Data) => {
    if (Data) {
      let UserToken = JWT.sign({ Email: FindUser.Email }, "Key");
      res.cookie("MyToken", UserToken);
      res.redirect("/profile");
    } else {
      res.send("Something Went Wrong");
    }
  });
});
App.post("/create", (req, res) => {
  let { Name, Email, PassWord } = req.body;

  Bcrypt.genSalt(10, (err, Salt) => {
    Bcrypt.hash(PassWord, Salt, async (Err, HashData) => {
      let NewUser = await UserModel.create({
        UserName: Name,
        Email: Email,
        PassWord: HashData,
      });

      const UserToken = JWT.sign({ Email }, "Key");
      res.cookie("MyToken", UserToken);
      res.redirect("/profile");
    });
  });
});
App.post("/create-post", authenticateToken, async (req, res) => {
  const { title, content, imageUrl } = req.body;

  try {
    const FindUser = await UserModel.findOne({ Email: req.user.Email });
    if (!FindUser) return res.send("User not found");

    const newPost = new PostModel({
      title,
      content,
      imageUrl,
      userId: FindUser._id,
    });

    await newPost.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Error creating post");
  }
});

App.post("/update/:Id", async (req, res) => {
  let { title, content, imageUrl } = req.body;
  let Update = await PostModel.findOneAndUpdate(
    { _id: req.params.Id },
    { title, content, imageUrl },
    { new: true }
  );
  res.redirect("/profile");
});

App.listen(8000, () => {
  console.log(`Server Started  : ${"http://localhost:8000"}`);
});
