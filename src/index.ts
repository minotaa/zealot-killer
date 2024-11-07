import { Client, Events, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, InteractionContextType } from "discord.js"
import "dotenv/config"
import { yellow, green, reset } from "kleur"
import { checkProfile, getTopSummoningEyes, isEventOccurring } from "./utils/functions";
import User from "./models/User";
import mongoose from "mongoose";

mongoose.connect(process.env.MONGODB_URI!!, { // @ts-ignore 
  autoIndex: false,
  family: 4 
})

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.DirectMessages
  ] 
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName.toLowerCase() == 'kill') {
    let topProfiles = (await getTopSummoningEyes())
    let position = topProfiles.findIndex((p) => p.user == interaction.user.id) + 1
    //console.log(position)
    console.log(yellow('‣'), reset(`${interaction.user.displayName} (${interaction.user.id}) performed the /kill command.`))
    await checkProfile(interaction.user.id)
    let profile = await User.find({
      user: interaction.user.id
    }).exec() // @ts-ignore
    profile[0].zealotsKilled += 1
    let embed = new EmbedBuilder()
      .setColor("#5a32a8")
      .addFields({
        name: "You killed a Zealot!",
        value: `You've killed **${profile[0].zealotsKilled} zealots** so far!`
      })
      .setAuthor({ name: `${interaction.user.username}`, iconURL: interaction.user.avatarURL(), url: 'https://minota.cc' })
      .setImage('https://cdn.discordapp.com/attachments/550440055651565599/1303199218923737201/Minecraft_entities_enderman.png?ex=672ae25a&is=672990da&hm=a43c2c66f23375bd8aeeedc175e6093513f56ad517dd4254b7ff1918aa57007a&')
      if (!profile[0].zealotsSinceLastEye) profile[0].zealotsSinceLastEye = 0
      let odds = 420
      if ((profile[0].zealotsSinceLastEye as number) >= 420 && (profile[0].zealotsSinceLastEye as number) < 630) {
        odds /= 2
        embed.addFields({
          name: "Bonus!",
          value: `Your odds have been multiplied by 2 since you killed more than 420 Zealots.`
        })
        console.log(yellow('‣'), reset(`Multiplying odds by 2 for ${interaction.user.displayName} (${interaction.user.id})`))
      } else if ((profile[0].zealotsSinceLastEye as number) >= 630 && (profile[0].zealotsSinceLastEye as number) < 840) {
        odds /= 3
        embed.addFields({
          name: "Bonus!",
          value: `Your odds have been multiplied by 3 since you killed more than 630 Zealots.`
        })
        console.log(yellow('‣'), reset(`Multiplying odds by 3 for ${interaction.user.displayName} (${interaction.user.id})`))
      } else if ((profile[0].zealotsSinceLastEye as number) >= 840) {
        odds /= 4
        embed.addFields({
          name: "Bonus!",
          value: `Your odds have been multiplied by 4 since you killed more than 840 Zealots.`
        })
        console.log(yellow('‣'), reset(`Multiplying odds by 4 for ${interaction.user.displayName} (${interaction.user.id})`))
      }
      if (isEventOccurring(odds)) { // @ts-ignore
      profile[0].summoningEyes += 1
      profile[0].zealotsSinceLastEye = 0
      embed.addFields({
        name: 'You\'ve found a Special Zealot!',
        value: `You have <:summoning_eye:1303201748881641532> **${profile[0].summoningEyes} summoning eyes** now!`
      })
      embed.setImage('https://cdn.discordapp.com/attachments/550440055651565599/1303201412120973352/SkyBlock_entities_special_zealot.png?ex=672ae464&is=672992e4&hm=027908e305249d4eec170f2c2b733f42b19abfe48bf186440fc8b6922a65a950&')
    } else {
      (profile[0].zealotsSinceLastEye as number) += 1
      embed.setFooter( {
        text: `Current summoning eye count: ${profile[0].summoningEyes} | Zealots since last eye: ${profile[0].zealotsSinceLastEye}`
      })
    }

    profile[0].save()
    await interaction.reply({ embeds: [embed] })
  }
  if (interaction.commandName.toLowerCase() == 'top') {
    let topProfiles = (await getTopSummoningEyes())
    topProfiles.slice(0, 9)
    let embed = new EmbedBuilder()
    embed.setColor("#5a32a8")
    embed.setTitle("Top 10 users")
    let formattedString = ""
    let index = 0
    await topProfiles.forEach(async profile => {
      let member = await client.users.fetch(profile.user as string)
      if (index == 0) {
        formattedString += ":first_place: "
      } else if (index == 1) {
        formattedString += ":second_place: "
      } else if (index == 2) {
        formattedString += ":third_place: "
      } else if (index == 3) {
        formattedString += ":four: "
      } else if (index == 4) {
        formattedString += ":five: "
      } else if (index == 5) {
        formattedString += ":six: "
      } else if (index == 6) {
        formattedString += ":seven: "
      } else if (index == 7) {
        formattedString += ":eight: "
      } else if (index == 8) {
        formattedString += ":nine: "
      } else if (index == 9) {
        formattedString += ":keycap_ten: "
      }

      formattedString += `${member.displayName} — <:summoning_eye:1303201748881641532> **${profile.summoningEyes} summoning eyes**\n`
      index += 1
    })
    console.log(formattedString)
    embed.setDescription(formattedString)
    await interaction.reply({ embeds: [embed] })
  }
})

client.once(Events.ClientReady, async c => {
  console.log(green("✓"), reset(`Ready! Successfully logged in as ${c.user.tag}!`));
  let commands = [
    new SlashCommandBuilder()
      .setName('kill')
      .setDescription('Kills a Zealot.')
      .setContexts(InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild),
    new SlashCommandBuilder()
      .setName('top')
      .setDescription('Shows the top 10 users.')
      .setContexts(InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild)
  ]
  try {
    const data = await rest.put(
			Routes.applicationCommands('1303189994349002752'),
			{ body: commands },
		); // @ts-ignore
    console.log(green("✓"), reset(`Successfully reloaded ${data.length} application (/) commands.`));
  } catch (error) {
    console.error(error)
  }
})

const rest = new REST()
rest.setToken(process.env.TOKEN);

client.login(process.env.TOKEN);