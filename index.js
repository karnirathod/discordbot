// Importing the discord.js library to interact with the Discord API
const Discord = require('discord.js');

// Creating a new Discord client instance
const client = new Discord.Client();

// Creating a map to store user-specific password generation details
const passwordMap = new Map();

// Event: Triggered when the bot successfully logs in
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Setting the bot's presence status and activity
  client.user.setPresence({
    status: 'online',
    activity: {
      name: '!help',
      type: 'WATCHING',
    },
  });
});

// Event: Triggered when a message is sent in a channel the bot can see
client.on('message', msg => {
  const channel = msg.channel;

  // Handling user interactions for password generation
  if (channel instanceof Discord.DMChannel && passwordMap.has(msg.author)) {
    handlePassword(msg);
    return;
  }

  if (msg.content.startsWith("!")) {
    const command = msg.content.substring(1).trim().toLowerCase();

    // Responding to the "ping" command with latency information
    if (command === 'ping') {
      msg.channel.send(`Latency is ${Date.now() - msg.createdTimestamp}ms.\nAPI Latency is ${Math.round(client.ws.ping)}ms \npong`);
    }
    // Reacting to the "react" command with a 😀 emoji
    else if (command === 'react') {
      msg.react('😀');
    }
    // Initiating the password generation process with the "password" command
    else if (command === 'password') {
      msg.author.createDM()
        .then(channel => {
          channel.send(`Should your password have capitals?`)
            .then(_ => passwordMap.set(msg.author, new PasswordBuilder()))
            .catch(_ => {
              msg.reply('Your DMs are closed!');
            });
        });
    }
    // Providing information about bot commands with the "help" command
    else if (command === 'help') {
      client.generateInvite({
        permissions: ['ADMINISTRATOR'],
      })
      .then(link => {
        // Creating an embed message with information about bot commands
        const embed = new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle('📌 Help - General')
          .setAuthor('Password Bot', 'https://i.imgur.com/by9RnKq.jpg')
          .setDescription(`Password bot is a Discord bot that generates random passwords.\n\n[Click to invite me](${link})`)
          .setThumbnail('https://i.imgur.com/by9RnKq.jpg')
          .addFields(
            { name: 'Commands', value: 'Here is an overview of all commands.' },
            { name: '`!password`: Creates random passwords', value: '\u200b' },
            { name: '`!ping`: Responds with a latency measurement', value: '\u200b' },
            { name: '`!react`: Reacts with a 😀 emoji', value: '\u200b' }
          )
          .setTimestamp()
          .setFooter('Password Bot - A Discord Bot (c) 2020 - 20XX');

        // Sending the embed message to the channel
        channel.send(embed);
      });
    }
    // Providing an invite link with the "invite" command
    else if (command === 'invite') {
      client.generateInvite({
        permissions: ['ADMINISTRATOR'],
      })
      .then(link => msg.reply(`Invite link: ${link}`));
    }
    else {
      // Responding to unknown commands with an error message
      msg.reply(`Command \`${command}\` was not found.\nSee !help for help`);
    }
  }
});

// Logging in the bot using its token
client.login();

// Function to handle the password generation process
function handlePassword(message) {
  const user = message.author;
  const builder = passwordMap.get(user);

  if (builder === undefined) {
    return;
  }

  switch (builder.stage) {
    case 0:
      const bool2 = parseBoolean(message);
      if (bool2 === null) {
        return;
      }

      builder.isCaptials = parseBoolean(message);
      message.channel.send('What length should your password be?');
      builder.stage++;
      break;

    case 1:
      const number = parseInt(message.content.trim());
      if (isNaN(number) || number > 100) {
        message.reply('You need to reply with a number less than 100');
        return;
      }

      builder.length = number;
      const pass = builder.generatePassword();
      message.channel.send(pass).then(m => m.pin());
      passwordMap.delete(user);
      break;
  }
}

// Arrays for positive and negative response phrases
var PositiveResponses = ["true", "yes", "y", "1", "t", "sure", "yeah", "yea"];
var NegativeResponses = ["false", "0", "n", "no", "nope", "nooo"];

// Function to parse a boolean response from a message
function parseBoolean(message) {
  if (PositiveResponses.includes(message.content.trim().toLowerCase())) {
    return true;
  } else if (NegativeResponses.includes(message.content.trim().toLowerCase())) {
    return false;
  } else {
    message.reply('You need to reply with yes or no.');
    return null;
  }
}

// Function to generate a random integer within a specified range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Class for building random passwords
class PasswordBuilder {
  constructor() {
    this.length = 0;
    this.isSymbols = false;
    this.isCaptials = false;
    this.stage = 0;
  }

  // Method to generate a random password
  generatePassword() {
    let out = "|| ";

    for (let i = 0; i < this.length; i++) {
      const symbolsOrCapitals = Math.random() > 0.3;
      // 70% chance of being letters

      if (symbolsOrCapitals) {
        const upperCase = Boolean(Math.round(Math.random()));
        if (this.isCaptials && upperCase) {
          out += String.fromCharCode(randomInt(65, 91)); // Uppercase letter
        } else {
          out += String.fromCharCode(randomInt(97, 123)); // Lowercase letter
        }
      } else {
        out += String.fromCharCode(randomInt(33, 47)); // Symbol
      }
    }
    out += " ||";

    // Creating an embed message to display the generated password
    return new Discord.MessageEmbed()
      .setTitle('Password')
      .setDescription(out)
      .setColor('#CD2A2A');
  }
}
