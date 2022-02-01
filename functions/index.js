const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const admin = require("firebase-admin");
admin.initializeApp();

const app = express();
const { body, validationResult } = require("express-validator");

app.get("/", async (req, res) => {
  const snapshot = await admin.firestore().collection("users").get();

  let users = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    users.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(users));
});

app.get("/:id", async (req, res) => {
  const snapshot = await admin.firestore().collection("users").doc(req.params.id).get();

  const userId = snapshot.id;
  const userData = snapshot.data();

  res.status(200).send(JSON.stringify({ id: userId, ...userData }));
});

const userCreationValidators = [
  body("email").notEmpty().withMessage("Email is required!").isEmail().withMessage("Email is invalid!"),
  body("firstName").notEmpty(),
  body("lastName").notEmpty(),
  body("age").notEmpty().isInt(),
  body("password").notEmpty().isLength({ min: 6 }),
  body("userType").notEmpty().isIn(["admin", "customer"]),
  body("language").optional().isIn(["javascript", "python", "C#"]),
];

app.post("/", userCreationValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const user = req.body;

  await admin.firestore().collection("users").add(user);

  res.status(201).send();
});

app.put("/:id", async (req, res) => {
  const body = req.body;

  await admin.firestore().collection("users").doc(req.params.id).update(body);

  res.status(200).send();
});

app.delete("/:id", async (req, res) => {
  await admin.firestore().collection("users").doc(req.params.id).delete();

  res.status(200).send();
});

exports.user = functions.https.onRequest(app);
