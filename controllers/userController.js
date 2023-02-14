const User = require("../models/User");

exports.login = function (req, res) {
  let user = new User(req.body);
  user
    .login()
    .then(() => {
      req.session.user = { username: user.data.username };
      req.session.save(() => res.redirect("/"));
    })
    .catch((err) => res.send(err));
};

exports.logout = function (req, res) {
  req.session.destroy(() => res.redirect("/"));
};

exports.register = function (req, res) {
  let user = new User(req.body);
  user.register();
  if (user.errors.length) {
    res.send(user.errors);
  } else {
    res.send("Congrats, there are no errors.");
  }
};

exports.home = function (req, res) {
  if (req.session.user) {
    res.render("home-dashboard", { username: req.session.user.username });
  } else {
    res.render("home-guest");
  }
};
