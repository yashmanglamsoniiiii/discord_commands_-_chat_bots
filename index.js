require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { nanoid } = require("nanoid");
const connectToMongoDB = require("./connect.js");
const URL = require("./models/url.js");
const express = require("express");

const app = express();

connectToMongoDB(process.env.MONGODB_URI)
  .then(() => console.log("successfully connected MongoDB"))
  .catch((err) => console.log(err));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("create")) {
    const url = message.content.split("create ")[1];
    // return message.reply({
    //   content: "Generating short ID for " + url,
    // });

    try {
      new globalThis.URL(url);
    } catch {
      return message.reply("plzz enter a valid url ");
    }

    try {
      const shortId = nanoid(6);
      await URL.create({
        shortId,
        redirectURL: url,
      });

      const shortURL = `http://localhost:3000/url/${shortId}`;

      return message.reply(`Short URL created : \n ${shortURL}`);
    } catch (error) {
      console.error("error creating short URL :", error);
      return message.reply("couldn't create short url");
    }
  }

  message.reply({
    content: "hi from bot",
  });
});

client.on("interactionCreate", (interaction) => {
  console.log(interaction);
  interaction.reply("Pong !!!");
});

client.login(
  process.env.DISCORD_TOKEN
);

app.get("/url/:shortId", async (req, res) => {
  try {
    const entry = await URL.findOne({
      shortId: req.params.shortId,
    });

    if (!entry) return res.status(404).send("short url not found");

    return res.redirect(entry.redirectURL);
  } catch (error) {
    console.error("Redirect error : ", error);
    return res.status(500).send("internal server error");
  }
});

app.listen(3000, () =>
  console.log(`URL server running on http://localhost:3000`),
);
