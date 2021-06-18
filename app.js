const express = require("express");
const app = express();
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-amrit:admintest123@cluster0.hjr9u.mongodb.net/todolistv3DB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const itemsSchema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your ToDo List!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const list1 = new List({
  name: "Welcome to ToDo List!",
  items: defaultItems,
});

const list2 = new List({
  name: "Hit the + button to add a new list.",
  items: defaultItems,
});

const list3 = new List({
  name: "<-- Hit this to delete a list.",
  items: defaultItems,
});

const list4 = new List({
  name: "Click on list Name to view items.",
  items: defaultItems,
});

const defaultLists = [list1, list2, list3, list4];

app.get("/", (req, res) => {
  List.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      List.insertMany(defaultLists, (err) => {
        console.log(err ? err : "Successfully saved default lists to DB.");
      });
      res.redirect("/");
    } else {
      res.render("home", { listTitle: date.getDate(), newListItem: foundItems });
    }
  });
});

app.post("/", (req, res) => {
  const newList = _.capitalize(req.body.newList);
  const list = new List({ name: newList, items: defaultItems });

  list.save();
  console.log("Successfully added new list.");
  res.redirect("/");
});

app.post("/delete", (req, res) => {
  const checkedId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === date.getDate()) {
    List.findByIdAndRemove(checkedId, (err) => {
      console.log(err ? err : "Successfully deleted checked list.");
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedId } } }, (err, foundList) => {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/favicon.ico", (req, res) => {
  res.status(204);
  res.end();
});

app.get("/:customListName", (req, res) => {
  const customListName = req.params.customListName;

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      // Show existing list
      res.render("list", { listTitle: customListName, newListItem: foundList.items });
    }
  });
});

app.post("/:customListName", (req, res) => {
  const customListName = req.params.customListName;
  const newItem = req.body.newItem;
  const item = new Item({ name: newItem });
  item.save();

  // Update existing list
  List.findOneAndUpdate({ name: customListName }, { $push: { items: item } }, (err, foundList) => {
    if (!err) {
      console.log("Successfully added new item.");
      res.redirect("/" + customListName);
    }
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server started successfully.");
});
