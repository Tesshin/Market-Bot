if (Number(process.version.slice(1).split(".")[0]) < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");

const MongoClient = require("mongodb").MongoClient;
const Discord = require("discord.js");
const Enmap = require("enmap");
const fs = require("fs");

const client = new Discord.Client();
const config = require("./settings.json");
client.config = config;

fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);

  files.forEach(file => {
    if (!file.endsWith(".js")) return;
    const event =require(`./events/${file}`);
    const eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
  });
});

client.commands = new Enmap();

fs.readdir("./commands/", (err, files) => {
  if (err) return console.error(err);

  files.forEach(file => {
    if (!file.endsWith(".js")) return;
    const props = require(`./commands/${file}`);
    const commandName = file.split(".")[0];
    console.log(`Attempting to load command: ${commandName}`);
    client.commands.set(commandName, props);
  });
  console.log("All commands have been loaded!");
});

MongoClient.connect(config.mongodb_uri, { useNewUrlParser: true }, function(err, db) {
  const dbo = db.db("cs_pound");
  dbo.collection("test").indexExists("createdAt_1", function(err, result) {
    if (!result) {
      dbo.collection("test").createIndex({ "createdAt": 1 }, { expireAfterSeconds: 0 });
    }
    db.close();
  });
});

client.login(config.token);