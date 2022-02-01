const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

admin.initializeApp();

const authMiddleware = require("../authMiddleware");

const db = admin.firestore();

const userApp = express();
userApp.use(authMiddleware);
const { body, validationResult } = require("express-validator");

userApp.use(cors({ origin: true }));

userApp.get("/", async (req, res) => {
  const snapshot = await db.collection("users").get();

  let users = [];
  snapshot.forEach((doc) => {
    let id = doc.id;
    let data = doc.data();

    users.push({ id, ...data });
  });

  res.status(200).send(JSON.stringify(users));
});

userApp.get("/:id", async (req, res) => {
  const snapshot = await db.collection("users").doc(req.params.id).get();

  const userId = snapshot.id;
  const userData = snapshot.data();

  res.status(200).send(JSON.stringify({ id: userId, ...userData }));
});

const userCreationValidators = [
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
  body("firstName").notEmpty(),
  body("lastName").notEmpty(),
  body("age").notEmpty().isInt(),
  body("password").notEmpty().isLength({ min: 8 }),
  body("userType").notEmpty().isIn(["admin", "customer", "assistant"]),
  body("language").isIn(["javascript", "python", "C#"]),
];

// Create User
userApp.post("/", userCreationValidators, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const user = req.body;

  await admin.firestore().collection("users").add(user);

  res.status(201).send();
});

userApp.put("/:id", async (req, res) => {
  const body = req.body;

  await db.collection("users").doc(req.params.id).update(body);

  res.status(200).send();
});

userApp.delete("/:id", async (req, res) => {
  await db.collection("users").doc(req.params.id).delete();

  res.status(200).send();
});

exports.user = functions.https.onRequest(userApp);
