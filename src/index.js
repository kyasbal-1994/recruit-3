const express = require("express");
const sha = require("sha256");
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator/check");
const auth = require("basic-auth");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const users = {
  TaroYamada: {
    password: sha.x2("PaSSwd4TY"),
    nickname: "たろー",
    comment: "僕は元気です"
  }
};

app.post(
  "/signup",
  [
    check("user_id").isString(),
    check("user_id").isLength({ max: 30, min: 6 }),
    check("password").isString(),
    check("password").isLength({ min: 8, max: 20 })
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const userId = req.body.user_id;
    const passwd = req.body.password;
    if (users[userId] === undefined) {
      users[userId] = {
        nickname: userId,
        passwd: sha.x2(passwd)
      };
      return res.status(200).json({
        message: "Account successfully created",
        user: {
          user_id: userId,
          nickname: userId
        }
      });
    } else {
      return res.status(400).json({
        message: "Account creation failed",
        cause: "already same user_id is used"
      });
    }
  }
);

app.get("/users/:userId", (req, res) => {
  const userId = req.params["userId"];
  const authUser = auth(req);
  if (
    users[authUser.name] &&
    users[authUser.name].password == sha.x2(authUser.pass)
  ) {
    if (users[userId] === undefined) {
      return res.status(404).json({ message: "No User found" });
    } else {
      const user = users[userId];
      const resultUser = {
        ...user
      };
      delete resultUser["password"];
      return res.status(200).json({
        message: "User details by user_id",
        user: {
          ...resultUser
        }
      });
    }
  } else {
    return res.status(401).json({ message: "Authentication Faild" });
  }
});

app.patch(
  "/users/:userId",
  [
    check("nickname").isString(),
    check("nickname").isLength({ max: 30 }),
    check("comment").isString(),
    check("comment").isLength({ max: 100 })
  ],
  (req, res) => {
    const userId = req.params["userId"];
    const nickname = req.body.nickname;
    const comment = req.body.comment;
    const authUser = auth(req);
    if (
      users[authUser.name] &&
      users[authUser.name].password == sha.x2(authUser.pass)
    ) {
      const user = users[authUser.name];
      if (!users[userId]) {
        return res.status(404).json({ message: "No User found" });
      }
      if (nickname === "" && comment === "") {
        return res.status(400).json({
          message: "User updation failed",
          cause: "required nickname or comment"
        });
      }
      if (userId !== authUser.name) {
        return res.status(403).json({
          message: "No Permission for Update"
        });
      }
      const newData = { nickname: userId };
      if (nickname !== "") {
        newData.nickname = nickname;
      }
      if (comment !== "") {
        newData.comment = comment;
      }
      users[userId] = {
        ...users[userId],
        ...newData
      };
      return res.status(200).json({
        message: "User successfully updated",
        recipe: [
          {
            nickname: user.nickname,
            comment: user.comment
          }
        ]
      });
    } else {
      return res.status(401).json({ message: "Authentication Faild" });
    }
  }
);

app.post("/close", (req, res) => {
  const authUser = auth(req);
  if (
    users[authUser.name] &&
    users[authUser.name].password == sha.x2(authUser.pass)
  ) {
    delete users[authUser.name];
    return res
      .status(200)
      .json({ message: "Account and user successfully removed" });
  } else {
    return res.status(401).json({ message: "Authentication Faild" });
  }
});

/* 2. listen()メソッドを実行して3000番ポートで待ち受け。*/
var server = app.listen(process.env.PORT || 3000, function() {
  console.log("Node.js is listening to PORT:" + server.address().port);
});
