const { Events, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(` Bot is ready! Logged in as ${client.user.tag}`);
        console.log(` Serving ${client.guilds.cache.size} guilds`);
        
        const commands = [];
        const commandsPath = path.join(__dirname, '..', 'commands');
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                }
            }
        }

        const rest = new REST().setToken(client.token);

        try {
            console.log(` Registering ${commands.length} application (/) commands...`);

            const data = await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );

            console.log(` Successfully registered ${data.length} application (/) commands.`);
        } catch (error) {
            console.error(' Error registering commands:', error);
        }
        
        client.user.setPresence({
            activities: [{
                name: `${client.guilds.cache.size} servers | /getquest`,
                type: 3 
            }],
            status: 'online'
        });
    }
};