const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;




const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";

const app = express();
app.locals._ = _;

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret: 'somegibberishtext',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/blogDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (!user.password == password) { return done(null, false); }
            return done(null, user);
        });
    }
));


passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

const postSchema = new mongoose.Schema({
    username: String,
    name: String,
    title: String,
    content: String
});

const Post = mongoose.model("Post", postSchema);

app.get("/", function(req, res) {

    if (req.isAuthenticated()) {
        Post.find({username: req.user.username}, function(err, posts) {
            res.render("home", {
                startingContent: homeStartingContent,
                posts: posts
            });
        });
    } else {
        res.redirect("/login");
    }



});


app.get("/compose", function(req, res) {
    if (req.isAuthenticated()) {
        Post.find({username: req.user.username}, function(err, posts) {
            res.render("compose");
    console.log(req.user);
        });
    } else {
        res.redirect("/login");
    }
});

app.post("/compose", function(req, res) {

    const post = new Post({
        name: _.lowerCase(req.body.postTitle),
        title: req.body.postTitle,
        username: req.user.username,
        content: req.body.postBody
    });

    post.save();

    res.redirect("/");

});

app.get("/posts/:postName", function(req, res) {
    const requestedTitle = _.lowerCase(req.params.postName);
    console.log(requestedTitle);

    Post.findOne({ name: requestedTitle }, function(err, post) {
        //console.log(post);
        res.render("post", {
            title: post.title,
            content: post.content
        });

    });


});

app.get("/login", function(req, res) {
    res.render("login");
});

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
        console.log("logged in YAY!");
    });

app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    User.register({
        username: req.body.username,
    }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/");
            });
        }
    });
});


app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });


app.listen(3000, function() {
    console.log("Server started on port 3000");
});