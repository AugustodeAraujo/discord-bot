const Discord = require("discord.js");
const config = require("./config.json");
const ytdl = require('ytdl-core');
const ffmpeg = require("ffmpeg")

// Login Bot
const client = new Discord.Client();
client.login(config.BOT_TOKEN);

// Prefix
const prefix = "!";

// Music Map
const queue = new Map();

// Bot Status
client.once("ready", () => {
    console.log("Bot is online!");
  });

  client.once("reconnecting", () => {
    console.log("Reconnecting!");
  });
  
  client.once("disconnect", () => {
    console.log("Disconnect!");
  });

// User Input
client.on("message", async function(message) { 
    
    if (message.author.bot) return; 
    if (!message.content.startsWith(prefix)) return;  
    
    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();



    // Latência
    if (command === "ping") {
        const timeTaken = Date.now() - message.createdTimestamp;
        message.reply(`Tá com lag? Latência de: ${timeTaken}ms.`);                   
    }  

    // Music 
    const serverQueue = queue.get(message.guild.id);

    if (command === "p"){
        execute(message, serverQueue);
        return;
    } else if (command === "skip") {
        execute(message, serverQueue);
        return;
    } else if (command === "stop"){
        execute(message, serverQueue);
        return;
    }

    async function execute(message, serverQueue) {
        const args = message.content.split(" ");
      
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
          return message.channel.send(
            "You need to be in a voice channel to play music!"
          );
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
          return message.channel.send(
            "I need the permissions to join and speak in your voice channel!"
          );
        }
      
        const songInfo = await ytdl.getInfo(args[1]);
        const song = {
              title: songInfo.videoDetails.title,
              url: songInfo.videoDetails.video_url,
         };
      
        if (!serverQueue) {
          const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
          };
      
          queue.set(message.guild.id, queueContruct);
      
          queueContruct.songs.push(song);
      
          try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
          } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
          }
        } else {
          serverQueue.songs.push(song);
          return message.channel.send(`${song.title} has been added to the queue!`);
        }
      }
      
      function skip(message, serverQueue) {
        if (!message.member.voice.channel)
          return message.channel.send(
            "You have to be in a voice channel to stop the music!"
          );
        if (!serverQueue)
          return message.channel.send("There is no song that I could skip!");
        serverQueue.connection.dispatcher.end();
      }
      
      function stop(message, serverQueue) {
        if (!message.member.voice.channel)
          return message.channel.send(
            "You have to be in a voice channel to stop the music!"
          );
          
        if (!serverQueue)
          return message.channel.send("There is no song that I could stop!");
          
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
      }
      
      function play(guild, song) {
        const serverQueue = queue.get(guild.id);
        if (!song) {
          serverQueue.voiceChannel.leave();
          queue.delete(guild.id);
          return;
        }
      
        const dispatcher = serverQueue.connection
          .play(ytdl(song.url))
          .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
          })
          .on("error", error => console.error(error));
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.textChannel.send(`Start playing: **${song.title}**`);
      }
   
});            

