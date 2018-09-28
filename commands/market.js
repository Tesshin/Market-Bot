exports.run = (client, message, args) => {
  message.channel.send(`Passed arguments: ${args}`).catch(console.error);
  if (args.length > 0) {
    const mongoose = require("mongoose");
    const moment = require("moment");
    const AsciiTable = require("ascii-table");
    const config = require("../config.json");
    const Item = require("../models/item.js");
    mongoose.connect(config.mongodb_key).catch(err => console.log(err));

    if (args[0] === "add") {
      if (args[1] === undefined) {
        message.channel.send("You didn't specify an item!").catch(err => console.log(err));
      } else {
        const name = args.slice(1).join(" ");
        message.channel.send(`Adding item **${name}**...`).catch(console.error);
        const item = new Item({
          _id: mongoose.Types.ObjectId(),
          itemName: name,
          submittedBy: message.author.tag,
          createdAt: new Date()
        });

        item.save()
          .then(result => console.log(result))
          .catch(err => console.log(err));

        message.channel.send(`Item **${name}** has been added!`).catch(err => console.log(err));
      }
    }
    else if (args[0] === "view") {
      message.channel.send("Viewing market...").catch(console.error);
      const market = new AsciiTable();
      market.setBorder("║", "═", "╬", "╬");
      market.setHeading("Item Name", "Submitted By", "Time Remaining");
      Item.find({}, function(err, docs) {
        docs.forEach(document => {
          console.log(document);
          const remaining = moment(document.createdAt).add(2, "m").diff(moment(), "s") + " seconds";
          console.log(remaining);
          market.addRow(document.itemName, document.submittedBy, remaining);
        });
        message.channel.send(`\`\`\`${market.toString()}\`\`\``).catch(err => console.log(err));
      });
    } else if (args[0] === "find") {
      message.channel.send("Searching for all items in market...").catch(err => console.log(err));
      Item.find({}, function(err, docs) {
        console.log(docs);
      });

    }
    else {
      message.channel.send("Base command from inside").catch(console.error);
    }
    mongoose.connection.close();
  } else {
    message.channel.send("Base command").catch(console.error);
  }
};