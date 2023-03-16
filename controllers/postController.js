const Post = require("../models/Post");

exports.viewCreateScreen = function (req, res) {
  res.render("create-post");
};

exports.create = async function (req, res) {
  let post = new Post(req.body, req.session.user._id);
  try {
    const newId = await post.create();
    req.flash("success", "New post successfully created.");
    req.session.save(() => res.redirect(`/post/${newId}`));
  } catch (errors) {
    errors.forEach((err) => req.flash("errors", err));
    req.session.save(() => res.redirect("/create-post"));
  }
};

exports.apiCreate = async function (req, res) {
  let post = new Post(req.body, req.apiUser._id);
  try {
    await post.create();
    res.json("Congrats.");
  } catch (errors) {
    res.json(errors);
  }
};

exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    res.render("single-post-screen", { post: post });
  } catch {
    res.render("404");
  }
};

exports.viewEditScreen = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);
    if (post.isVisitorOwner) {
      res.render("edit-post", { post: post });
    } else {
      req.flash("errors", "You do not have permission to perform that action.");
      req.session.save(() => res.redirect("/"));
    }
  } catch {
    res.render("404");
  }
};

exports.edit = async function (req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id);
  try {
    const status = await post.update();
    if (status === "success") {
      req.flash("success", "Post successfully updated.");
      req.session.save(() => res.redirect(`/post/${req.params.id}/edit`));
    } else {
      // owner but val err
      post.errors.forEach((err) => {
        req.flash("errors", err);
      });
      req.session.save(() => res.redirect(`/post/${req.params.id}/edit`));
    }
  } catch {
    // no req id or no ownership
    req.flash("errors", "You do not have permission to perform that action.");
    req.session.save(() => res.redirect("/"));
  }
};

exports.delete = async function (req, res) {
  try {
    await Post.delete(req.params.id, req.visitorId);
    req.flash("success", "Post successfully deleted");
    req.session.save(() =>
      res.redirect(`/profile/${req.session.user.username}`)
    );
  } catch {
    req.flash("errors", "You do not have permission to perform that action.");
    req.session.save(() => res.redirect("/"));
  }
};

exports.apiDelete = async function (req, res) {
  try {
    await Post.delete(req.params.id, req.apiUser._id);
    res.json("Success");
  } catch {
    res.json("You do not have permission to perform that action.");
  }
};

exports.search = async function (req, res) {
  try {
    const posts = await Post.search(req.body.searchTerm);
    res.json(posts);
  } catch {
    res.json([]);
  }
};
