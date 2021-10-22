const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const LocalStrategy = require('passport-local').Strategy;

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

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });

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
    title: String,
    content: String
});

const Post = mongoose.model("Post", postSchema);

app.get("/", function(req, res) {

    if (req.isAuthenticated()) {
        Post.find({username: req.user.username}, function(err, posts) {
            //console.log(posts);
            res.render("home", {
                posts: posts,
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
        title: req.body.postTitle,
        username: req.user.username,
        content: req.body.postBody
    });

    post.save();

    res.redirect("/");

});

app.get("/posts/:postName", function(req, res) {
    const requestedTitle = req.params.postName;
    //console.log(requestedTitle);
    Post.findOne({ _id: requestedTitle }, function(err, post) {
        //console.log(post);

        if (req.isAuthenticated() && req.user.username == post.username) {
            res.render("post", {
                title: post.title,
                content: post.content
            });
        } else {
            res.redirect("/login");
        }


});
});

app.get("/login", function(req, res) {
    res.render("login");
});

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
        //console.log("logged in!");
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