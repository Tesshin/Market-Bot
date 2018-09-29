exports.run = (client, message, args) => {
  const config = require("../config.json");
  let invalidCommand = false;
  if (args.length > 0) {
    const MongoClient = require("mongodb").MongoClient; // MongoDB Client
    const moment = require("moment"); // Handling adding time
    const AsciiTable = require("ascii-table"); // Create `!market view` table

    if (args[0] === "add") { // If user calls add command
      if (args[1] === undefined) { // If user doesn't provide an item
        message.channel.send("You didn't specify an item!").catch(err => console.log(err));
      } else {
        let time = config.default_listing_time; // Get default listing time
        let name = args.slice(1).join(" "); // Get name of item
        if (args.slice(-1)[0].match(/^(\d{1,2})m?/)) { // If user specified a listing time
          time = parseInt(args.slice(-1)[0].match(/^(\d{1,2})m?/)[0]); // Get listing time
          name = args.slice(1, -1).join(" "); // Get name of item
        }
        if (name.length > 40) {
          message.channel.send("That item name is too long!").catch(err => console.log(err));
        } else {
          message.channel.send(`Adding item **${name}** for ${time} minute(s)...`).catch(err => console.log(err));
          MongoClient.connect(config.mongodb_uri, {useNewUrlParser: true}, function (err, db) { // Connect to MongoDB
            const dbo = db.db(config.database_name); // Select database
            dbo.collection(config.collection_name).insertOne({ // Insert a document
              itemName: name, // Name of item
              submittedBy: message.author.tag, // Discord tag of user
              createdAt: moment().add(time, "m").toDate() // Date item is added
            });
            db.close();
            message.channel.send(`Item **${name}** has been added!`).catch(err => console.log(err));
          });
        }
      }
    }
    else if (args[0] === "view") { // If user calls view command
      message.channel.send("Loading market...").catch(err => console.log(err));
      const market = new AsciiTable(); // Create ASCII table
      market.setBorder("║", "═", "╬", "╬");
      market.setHeading("Item Name", "Submitted By", "Time Remaining");
      MongoClient.connect(config.mongodb_uri, {useNewUrlParser: true}, function (err, db) { // Connect to MongoDB
        const dbo = db.db(config.database_name); // Select databse
        dbo.collection(config.collection_name).find({}).toArray(function (err, result) { // Get all documents in collection into array
          if (err) throw err;
          if (result.length === 0) { // If no documents in array
            message.channel.send("```No items are currently listed.```");
          } else {
            result.forEach(item => { // For each document
              const remaining = moment(item["createdAt"]).diff(moment(), "m") + " minute(s)"; // Get how long until document expires
              market.addRow(item["itemName"], item["submittedBy"], remaining); // Add item to table
            });
            message.channel.send(`\`\`\`${market.toString()}\`\`\``).catch(err => console.log(err));
            db.close();
          }
        });
      });
    } else {
      invalidCommand = true;
    }
  } else {
    invalidCommand = true;
  }
  if (invalidCommand) {
    message.channel.send({embed: {
      color: parseInt(config.embed_colour, 16), // Convert hex into decimal
      title: "Market Commands:",
      fields: [{
        name: `${config.prefix}market add <time>`,
        value: "Add an item to the market."
      },
      {
        name: `${config.prefix}market view`,
        value: "View all items currently in the market."
      }]
    }}).catch(err => console.log(err));
  }
};