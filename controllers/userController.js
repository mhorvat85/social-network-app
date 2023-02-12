const User = require("../models/User");

exports.register = function (req, res) {
  let user = new User(req.body);
  user.register();
  res.send("Tnx for trying to registrate!");
};

exports.home = function (req, res) {
  res.render("home-guest");
};
