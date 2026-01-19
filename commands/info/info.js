const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Display bot information and developer details'),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        const client = interaction.client;
        const developerId = '640239524361797699';
        const botInviteUrl = 'https://discord.com/oauth2/authorize?client_id=1458254389608321167&permissions=8&integration_type=0&scope=bot';
        
        let bannerUrl = client.user.bannerURL({ size: 1024, dynamic: true });
        if (!bannerUrl) {
            bannerUrl = client.user.displayAvatarURL({ size: 1024, dynamic: true });
        }

        const sections = [];
        const textDisplays = [];

        const avatarUrl = client.user.displayAvatarURL({ size: 1024, dynamic: true });
        
        const infoSection = new SectionBuilder()
            .setThumbnailAccessory(
                new ThumbnailBuilder({ media: { url: avatarUrl } })
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**Bot Information**\n${client.user.tag}\n\n**Developer**\n<@${developerId}>`)
            );
        sections.push(infoSection);

        textDisplays.push(
            new TextDisplayBuilder().setContent(`**Bot ID**\n\`${client.user.id}\`\n\n**Developer ID**\n\`${developerId}\`\n\n**Servers**\n${client.guilds.cache.size} servers`)
        );

        const buttonSection = new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('Add Bot to Server')
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel('Add Bot')
                    .setURL(botInviteUrl)
            );
        sections.push(buttonSection);

        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addSectionComponents(...sections)
            .addTextDisplayComponents(...textDisplays);

        if (bannerUrl) {
            const mediaGallery = new MediaGalleryBuilder()
                .addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(bannerUrl)
                );
            container.addMediaGalleryComponents(mediaGallery);
        }

        const components = [
            container,
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
        ];

        try {
            await interaction.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: components
            });
        } catch (error) {
            console.error('Error sending info message:', error);
            await interaction.editReply({
                content: 'حدث خطأ أثناء إرسال المعلومات.',
                ephemeral: true
            }).catch(() => {});
        }
    }
};

