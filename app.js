const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
mongoose.set('strictQuery', true); //to get rid of mongoose deprication error

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://Shoaib:svTq16aAaYh5FfJj@cluster0.4w0cefj.mongodb.net/todolistDB');
}

//items Schema
const itemsSchema = new mongoose.Schema({ name: { type: String, required: true } });
const Item = mongoose.model("item", itemsSchema);
const newItem1 = new Item({ name: "Welcome to the TodoList!" });
const newItem2 = new Item({ name: "Hit + to Add into list" });
const newItem3 = new Item({ name: "<== Check the box to cross the item of the list" })
const defaultItems = [newItem1, newItem2, newItem3];

//List Schema
const listSchema = { name: String, items: [itemsSchema] };
const List = mongoose.model("list", listSchema);


app.get("/", (req, res) => {

  Item.find({}, (err, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems, (err) => { if (err) { console.log(err) } else { console.log("Added Successfull"); } })
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
      console.log("Default list Added!");
    };
  });
});


//app.post for adding new list items to the database
app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newName = new Item({ name: itemName }); //simpler way add the value or u can do it using model.insertMany

  if (listName === "Today") {
    newName.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      if (err) {
        console.log(err)
      } else {
        foundList.items.push(newName);
        foundList.save();
        res.redirect(`/${listName}`);
      };

    });
  }
  // below commented out code does the same thing.
  // Item.insertMany({name: itemName}, (err, doc) => {if (err) {console.log(err)} else {console.log(doc);}});
});


//app.post for deleting the cross list for the database
app.post("/delete", (req, res) => {
  const toDelete = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove({ _id: toDelete }, (err) => { if (err) { console.log(err) } else { console.log("successfully deleted an Item from the Today list") } });
    res.redirect("/")
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: toDelete } } }, (err, results) => {
      if (!err) {
        res.redirect(`/${listName}`)
      }
    });
  }
});

app.get("/:listName", (req, res) => {
  const listName = _.capitalize(req.params.listName);

  List.findOne({ name: listName }, (err, results) => {
    if (!err) if (!results) {
      const dynamicList = new List({
        name: listName,
        items: defaultItems
      });
      dynamicList.save((err, results) => {
        res.redirect(`/${listName}`);
      });

    } else {
      res.render("list", { listTitle: results.name, newListItems: results.items })
    }

  })
})


app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
