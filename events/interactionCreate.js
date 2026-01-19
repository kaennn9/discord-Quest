const { Events, Collection } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(` No command matching ${interaction.commandName} was found.`);
            return;
        }

        if (command.data.default_member_permissions) {
            if (!interaction.member || !interaction.guild) {
                return interaction.reply({
                    content: '> This command can only be used in a server!',
                    ephemeral: true
                });
            }
            
            const permissions = interaction.member.permissions;
            const requiredPermissions = BigInt(command.data.default_member_permissions);
            const isOwner = interaction.guild.ownerId === interaction.user.id;
            
            if (!permissions.has(requiredPermissions) && !isOwner) {
                return interaction.reply({
                    content: '> You do not have permission to use this command!',
                    ephemeral: true
                });
            }
        }

        const { cooldowns } = interaction.client;
        const commandName = command.data.name;
        
        if (!cooldowns.has(commandName)) {
            cooldowns.set(commandName, new Collection());
        }

        const now = Date.now();
        const commandCooldowns = cooldowns.get(commandName);
        const cooldownAmount = (command.cooldown || 3) * 1000;
        const guildId = interaction.guild?.id || 'dm';
        const cooldownKey = `${guildId}-${interaction.user.id}`;

        if (commandCooldowns.has(cooldownKey)) {
            const expirationTime = commandCooldowns.get(cooldownKey) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({
                    content: `> ⏳ Please wait ${timeLeft.toFixed(1)} more seconds before reusing the \`${command.data.name}\` command.`,
                    ephemeral: true
                });
            }
        }

        commandCooldowns.set(cooldownKey, now);
        setTimeout(() => commandCooldowns.delete(cooldownKey), cooldownAmount);

        try {
            await command.execute(interaction);
            const guildName = interaction.guild?.name || 'DM';
            console.log(` Command executed: ${interaction.commandName} by ${interaction.user.tag} in ${guildName}`);
        } catch (error) {
            console.error(` Error executing ${interaction.commandName}:`, error);
            
            const errorMessage = {
                content: ' An error occurred while executing this command!',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};