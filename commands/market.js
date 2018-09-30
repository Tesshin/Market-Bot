exports.run = (client, message, args) => {
  const Discord = require("discord.js");
  const config = require("../config.json");
  let invalidCommand = false;
  if (args.length > 0) {
    const MongoClient = require("mongodb").MongoClient; // MongoDB Client
    const moment = require("moment"); // Handling adding time

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
          MongoClient.connect(config.mongodb_uri, {useNewUrlParser: true}, function(err, db) { // Connect to MongoDB
            const dbo = db.db(config.database_name); // Select database
            dbo.collection(config.collection_name).insertOne({ // Insert a document
              itemName: name, // Name of item
              submittedBy: message.author.tag, // Discord tag of user
              createdAt: moment().add(time, "m").toDate() // Date item is added
            });
            db.close();
            message.channel.send(`Item **${name}** has been added for ${time} minute(s)!`).catch(err => console.log(err));
          });
        }
      }
    }
    else if (args[0] === "view") { // If user calls view command
      let pageNumber = 0;
      MongoClient.connect(config.mongodb_uri, {useNewUrlParser: true}, function(err, db) { // Connect to MongoDB
        const dbo = db.db(config.database_name); // Select database
        dbo.collection(config.collection_name).find({}).toArray(function(err, result) { // Get all documents in collection into array
          if (err) throw err;
          if (!result.length) { // If no documents in array
            message.channel.send("No items are currently listed.").catch(err => console.log(err));
          } else {
            if (isNaN(args[1]) || args[1] < 1 || args[1] === undefined) { // If user provided an invalid number
              pageNumber = 0;
            } else {
              pageNumber = parseInt(args[1]) - 1; // Set page number to selected number
            }

            if (!result.slice(pageNumber * config.page_limit, (pageNumber * config.page_limit) + config.page_limit).length) {
              message.channel.send("There are no items on this page.").catch(err => console.log(err));
            } else {
              const items = result.slice(pageNumber * config.page_limit, (pageNumber * config.page_limit) + config.page_limit);
              const listings = [];
              items.forEach(item => {
                const listing = `**${item["itemName"]}** | ${item["submittedBy"]} | ${moment(item["createdAt"]).diff(moment(), "m")} minute(s)`; // Item Name | User#1234 | X minute(s)
                listings.push(listing);
              });
              const description = listings.join("\n");
              let pastLimit;
              if (pageNumber * config.page_limit + config.page_limit > result.length) {
                pastLimit = result.length
              } else {
                pastLimit = pageNumber * config.page_limit + config.page_limit
              }
              const embed = new Discord.RichEmbed()
                .setTitle("Currently Listed Items:")
                .setColor(config.embed_colour)
                .setDescription(description)
                .setFooter(`Showing ${pageNumber * config.page_limit + 1}-${pastLimit} of ${result.length} listed items.`);
              message.channel.send({embed}).catch(err => console.log(err));
            }
          }
          db.close();
        });
      });
    } else {
      invalidCommand = true;
    }
  } else {
    invalidCommand = true;
  }
  if (invalidCommand) {
    const embed = new Discord.RichEmbed()
      .setTitle("Market Commands:")
      .setColor(config.embed_colour)
      .addField(`${config.prefix}market add <time>`, "Add an item to the market.")
      .addField(`${config.prefix}market view`, "View all items currently in the market.");
    message.channel.send({embed}).catch(err => console.log(err));
  }
};