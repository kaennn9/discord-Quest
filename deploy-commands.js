const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

// Grab all command files
for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ Prepared command: ${command.data.name}`);
        } else {
            console.log(`❌ Warning: Command at ${filePath} is missing required "data" or "execute" property`);
        }
    }
}

// Construct and prepare an instance of the REST module
const token = process.env.DISCORD_TOKEN || require('./config.js').token;
const clientId = process.env.CLIENT_ID || require('./config.js').clientId;

if (!token) {
    console.error('❌ Error: No token provided. Please set DISCORD_TOKEN in .env file or in config.js');
    process.exit(1);
}

if (!clientId) {
    console.error('❌ Error: No CLIENT_ID provided. Please set CLIENT_ID in .env file or in config.js');
    console.log('💡 Tip: You can find your Client ID in Discord Developer Portal > Application > General Information');
    process.exit(1);
}

const rest = new REST().setToken(token);

// Deploy commands
(async () => {
    try {
        console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);

        // Register commands globally (can take up to 1 hour to propagate)
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands globally.`);
        
        // If you want to register commands to a specific guild (instant), uncomment below:
        /*
        const guildId = process.env.GUILD_ID || require('./config.js').guildId;
        if (guildId) {
            const guildData = await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );
            console.log(`✅ Successfully reloaded ${guildData.length} application (/) commands to guild ${guildId}.`);
        }
        */
        
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
})();

