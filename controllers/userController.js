const jwt = require("jsonwebtoken");
const sendgrid = require("@sendgrid/mail");
sendgrid.setApiKey(process.env.SENDGRIDAPIKEY);

const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");

exports.apiGetPostsByUsername = async function (req, res) {
  try {
    let authorDoc = await User.findByUsername(req.params.username);
    console.log(authorDoc);
    let posts = await Post.findByAuthorId(authorDoc._id);
    console.log(posts);
    res.json(posts);
  } catch {
    res.json("Sorry, invalid user requested.");
  }
};

exports.doesUsernameExist = function (req, res) {
  User.findByUsername(req.body.username)
    .then(() => {
      res.json(true);
    })
    .catch(() => {
      res.json(false);
    });
};

exports.doesEmailExist = async function (req, res) {
  let emailBool = await User.doesEmailExist(req.body.email);
  res.json(emailBool);
};

exports.sharedProfileData = async function (req, res, next) {
  let isVisitorsProfile = false;
  let isFollowing = false;
  if (req.session.user) {
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);
    isFollowing = await Follow.isVisitorFollowing(
      req.profileUser._id,
      req.visitorId
    );
  }
  req.isVisitorsProfile = isVisitorsProfile;
  req.isFollowing = isFollowing;
  // post, follower and following counts
  let postsCountPromise = Post.countPostsByAuthor(req.profileUser._id);
  let followersCountPromise = Follow.countFollowersById(req.profileUser._id);
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id);
  let [postsCount, followersCount, followingCount] = await Promise.all([
    postsCountPromise,
    followersCountPromise,
    followingCountPromise,
  ]);

  req.postsCount = postsCount;
  req.followersCount = followersCount;
  req.followingCount = followingCount;

  next();
};

exports.mustBeLoggedIn = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash("errors", "You must be logged in to perform that action.");
    req.session.save(() => res.redirect("/"));
  }
};

exports.apiMustBeLoggedIn = function (req, res, next) {
  try {
    req.apiUser = jwt.verify(req.body.token, process.env.JWTSECRET);
    next();
  } catch {
    res.json("Sorry, you must provide a valid token.");
  }
};

exports.login = function (req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(() => {
      req.session.user = {
        username: user.data.username,
        avatar: user.avatar,
        _id: user.data._id,
      };
      req.session.save(() => res.redirect("/"));
    })
    .catch((err) => {
      req.flash("errors", err); // req.session.flash.errors = [err]
      req.session.save(() => res.redirect("/"));
    });
};

exports.apiLogin = function (req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(() => {
      res.json(
        jwt.sign({ _id: user.data._id }, process.env.JWTSECRET, {
          expiresIn: "7d",
        })
      );
    })
    .catch(() => {
      res.json("Sorry, your values are not correct.");
    });
};

exports.logout = function (req, res) {
  req.session.destroy(() => res.redirect("/"));
};

exports.register = function (req, res) {
  let user = new User(req.body);
  user
    .register()
    .then(() => {
      sendgrid.send({
        to: "youremail@provider.com", // register to sendgrid to activate this functionality
        from: "youremail@provider.com", // sender authentication
        subject: "Thank you for registering to this application!",
        text: "You did a great job registering to this application.",
        html: "You did a <strong>great</strong> job registering to this application.",
      });
      req.session.user = {
        username: user.data.username,
        avatar: user.avatar,
        _id: user.data._id,
      };
      req.session.save(() => res.redirect("/"));
    })
    .catch((regErrors) => {
      regErrors.forEach((err) => {
        req.flash("regErrors", err);
      });
      req.session.save(() => res.redirect("/"));
    });
};

exports.home = async function (req, res) {
  if (req.session.user) {
    let posts = await Post.getFeed(req.visitorId);
    res.render("home-dashboard", { posts: posts });
  } else {
    res.render("home-guest", {
      regErrors: req.flash("regErrors"),
    });
  }
};

exports.ifUserExists = function (req, res, next) {
  User.findByUsername(req.params.username)
    .then((userDocument) => {
      // for next func in stack
      req.profileUser = userDocument;
      next();
    })
    .catch(() => {
      res.render("404");
    });
};

exports.profilePostsScreen = function (req, res) {
  Post.findByAuthorId(req.profileUser._id)
    .then((posts) => {
      res.render("profile", {
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        posts: posts,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        currentPage: "posts",
        counts: {
          postsCount: req.postsCount,
          followersCount: req.followersCount,
          followingCount: req.followingCount,
        },
      });
    })
    .catch(() => {
      res.render("404");
    });
};

exports.profileFollowersScreen = async function (req, res) {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id);
    res.render("profile-followers", {
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      followers: followers,
      currentPage: "followers",
      counts: {
        postsCount: req.postsCount,
        followersCount: req.followersCount,
        followingCount: req.followingCount,
      },
    });
  } catch {
    res.render("404");
  }
};

exports.profileFollowingScreen = async function (req, res) {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id);
    res.render("profile-following", {
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      following: following,
      currentPage: "following",
      counts: {
        postsCount: req.postsCount,
        followersCount: req.followersCount,
        followingCount: req.followingCount,
      },
    });
  } catch {
    res.render("404");
  }
};
