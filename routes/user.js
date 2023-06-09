const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const router = express.Router();

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    // console.log(req.body);
    const { username, email, password, newsletter } = req.body;

    if (
      !username ||
      !email ||
      !password ||
      //(newsletter !== true && newsletter !== false)
      typeof newsletter !== "boolean"
    ) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    // Je veux aller chercher dans ma collection User un élément dont la clef email contient req.body.email.

    const userWithEmailReceived = await User.findOne({ email: email });
    // console.log(serWithEmailReceived);

    if (userWithEmailReceived !== null) {
      return res.status(409).json({ message: "This email is already used." });
    }

    const token = uid2(64);
    const salt = uid2(16);
    const hash = SHA256(salt + password).toString(encBase64);
    // console.log(token);
    // console.log(salt);
    // console.log(hash);

    const newUser = new User({
      email: email,
      account: { username: username },
      newsletter: newsletter,

      token: token,
      salt: salt,
      hash: hash,
    });
    // console.log(newUser);

    // J'enregistre dans la BDD
    await newUser.save();

    // Renvoyer un nouvel objet en réponse avec les clés _id, token, account: username
    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // console.log(req.body);
    const { email, password } = req.body;

    // Aller chercher dans ma BDD, dans ma collection User un utilisateur ayant comme email le mail reçu en body
    const user = await User.findOne({ email: email });
    // Si j'en trouve pas, je renvoie une erreur
    if (user === null) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Si j'en trouve un je continue
    const newHash = SHA256(user.salt + password).toString(encBase64);

    console.log(newHash);

    if (newHash !== user.hash) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({ _id: user._id, token: user.token, account: user.account });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
