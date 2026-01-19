const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`Prepared command: ${command.data.name}`);
        } else {
            console.log(`Warning: Command at ${filePath} is missing required "data" or "execute" property`);
        }
    }
}

const token = process.env.DISCORD_TOKEN || require('./config.js').token;
const clientId = process.env.CLIENT_ID || require('./config.js').clientId;

if (!token) {
    console.error('Error: No token provided. Please set DISCORD_TOKEN in .env file or in config.js');
    process.exit(1);
}

if (!clientId) {
    console.error('Error: No CLIENT_ID provided. Please set CLIENT_ID in .env file or in config.js');
    console.log('Tip: You can find your Client ID in Discord Developer Portal > Application > General Information');
    process.exit(1);
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
        
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();
