const mongoose = require("mongoose");
const { connectionString } = require("./config").mongo;

const User = require("./models/user");
const Story = require("./models/story");
const NewStory = require("./models/NewStory");
const ActiveUser = require("./models/ActiveUser");
const username = require("./lib/middleware/username");

if (!connectionString) {
  console.error("MongoDB connection string missing!");
  process.exit(1);
}

mongoose.connect(connectionString, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
const db = mongoose.connection;
db.on("error", (err) => {
  console.error("MongoDB error: " + err.message);
  process.exit;
});
db.once("open", () => console.log("mongoDB connection established"));

Story.find((err, stories) => {
  if (err) return console.error(err);
  if (stories.length) return;

  new Story({
    title: "example1",
    pages: 3,
    content: [
      {
        type: "description",
        data: { data: "this is a description" },
        js_completed: "/js/description.js",
      },
      {
        type: "description",
        data: { data: "this is another description" },
        js_completed: "/js/description.js",
      },
      {
        type: "description",
        data: { data: "fine" },
        js_completed: "/js/end.js",
      },
    ],
  }).save();
});

module.exports = {
  getUsers: async (options = {}) => User.find(options),
  saveUser: async (username, id) => {
    await User.updateOne({ id }, { username }, { upsert: true });
  },
  getStories: async (options = {}, fields = "") =>
    NewStory.find(options, fields),
  saveStory: async (storyname, adj, nodes, css, published) => {
    await NewStory.updateOne(
      { title: storyname },
      { pages: nodes.length + 1, adj, nodes, css, published },
      { upsert: true }
    );
  },
  deleteStory: async (options = {}) => {
    NewStory.deleteOne(options, function (err) {});
  },
  saveActiveUser: async (username, id, story, activity) => {
    await ActiveUser.updateOne(
      { id },
      { username, story, activity },
      { upsert: true }
    );
  },
  deleteActiveUser: async (options = {}) => {
    await ActiveUser.deleteOne(options);
  },
};
