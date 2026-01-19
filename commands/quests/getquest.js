const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getquest')
        .setDescription('Get complete quest information by ID')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('The quest ID or full URL (e.g., 12345 or https://discord.com/quests/12345)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Choose embed color')
                .addChoices(
                    { name: '🔴 Red', value: '#ff0000' },
                    { name: '🟢 Green', value: '#00ff00' },
                    { name: '🔵 Blue', value: '#0000ff' },
                    { name: '🟡 Yellow', value: '#ffff00' },
                    { name: '🟣 Purple', value: '#800080' },
                    { name: '⚪ White', value: '#ffffff' },
                    { name: '⚫ Black', value: '#000000' },
                    { name: '🔶 Orange', value: '#ffa500' },
                    { name: '🟢 Emerald', value: '#50c878' },
                    { name: '🔷 Light Blue', value: '#add8e6' },
                    { name: '🌹 Pink', value: '#ff69b4' },
                    { name: '🌙 Dark Blue', value: '#00008b' },
                    { name: '🍃 Mint', value: '#98ff98' },
                    { name: '🌺 Magenta', value: '#ff00ff' },
                    { name: '🔥 Crimson', value: '#dc143c' },
                    { name: '💎 Cyan', value: '#00ffff' },
                    { name: '🌿 Lime', value: '#32cd32' },
                    { name: '🌊 Teal', value: '#008080' },
                    { name: '🍇 Violet', value: '#8a2be2' },
                    { name: '🌻 Gold', value: '#ffd700' },
                    { name: '🌑 Dark Gray', value: '#404040' },
                    { name: '🌕 Silver', value: '#c0c0c0' },
                    { name: '🌊 Aqua', value: '#00ced1' },
                    { name: '🌹 Rose', value: '#ff007f' },
                    { name: '🌲 Forest Green', value: '#228b22' }
                )
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send quest info to')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
        .addStringOption(option =>
            option.setName('mention')
                .setDescription('How to mention users')
                .addChoices(
                    { name: 'Everyone', value: '@everyone' },
                    { name: 'Here', value: '@here' },
                    { name: 'No Mention', value: 'none' }
                )
        )
        .addStringOption(option =>
            option.setName('thumbnail')
                .setDescription('Choose thumbnail source')
                .addChoices(
                    { name: 'Default (Based on Task Type)', value: 'default' },
                    { name: 'Node 999 (Logotype)', value: 'node' }
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    cooldown: 15,
    
    async execute(interaction) {
        let questId = interaction.options.getString('id');
        
        // استخرج معرف الكويست إذا كان المستخدم أدخل رابطاً كاملاً
        const urlMatch = questId.match(/discord\.com\/quests\/(\d+)/i);
        if (urlMatch) {
            questId = urlMatch[1]; // استخرج الجزء الرقمي (المعرف) من الرابط
            console.log(`Extracted Quest ID from URL: ${questId}`);
        }
        
        const embedColor = interaction.options.getString('color') || '#ffffff';
        const targetChannel = interaction.options.getChannel('channel');
        const mentionType = interaction.options.getString('mention') || 'none';
        const thumbnailOption = interaction.options.getString('thumbnail') || 'default';

        await interaction.deferReply({ ephemeral: true });

        console.log(`Fetching quest with ID: ${questId} | Color: ${embedColor}`);
        try {
            const questInfo = await getQuestInfoWithStatus(questId);

            if (!questInfo) {
                return await interaction.editReply({
                    content: 'Quest not found or invalid ID.',
                    ephemeral: true
                });
            }

            console.log('═══════════════════════════════════════════════════');
            console.log('📋 QUEST INFORMATION:');
            console.log('═══════════════════════════════════════════════════');
            console.log('Quest ID:', questInfo.id);
            console.log('Quest Name:', questInfo.name);
            console.log('Description:', questInfo.description || 'No description');
            console.log('Game Title:', questInfo.gameTitle || 'N/A');
            console.log('Game Publisher:', questInfo.gamePublisher || 'N/A');
            console.log('Task Type:', questInfo.taskType);
            console.log('Status:', questInfo.status);
            console.log('Progress:', questInfo.progress);
            console.log('Target:', questInfo.target);
            console.log('Application:', questInfo.application || 'N/A');
            console.log('Enrolled At:', questInfo.enrolledAt || 'N/A');
            console.log('Completed At:', questInfo.completedAt || 'N/A');
            console.log('Starts At:', questInfo.startsAt || 'N/A');
            console.log('Expires At:', questInfo.expiresAt || 'N/A');
            console.log('Link:', questInfo.link || 'N/A');
            console.log('Hero Image:', questInfo.heroImage || 'N/A');
            console.log('Rewards:', JSON.stringify(questInfo.rewards || [], null, 2));
            console.log('All Assets:', JSON.stringify(questInfo.allAssets || {}, null, 2));
            console.log('Quest URL:', `https://discord.com/quests/${questInfo.id}`);
            console.log('═══════════════════════════════════════════════════');

            let thumbnailUrl;
            if (thumbnailOption === 'node') {
                if (questInfo.allAssets?.logotype) {
                    const logotype = questInfo.allAssets.logotype;
                    if (logotype.startsWith('http')) {
                        thumbnailUrl = logotype;
                    } else {
                        thumbnailUrl = `https://cdn.discordapp.com/quests/${questInfo.id}/${logotype}`;
                    }
                } else {
                    thumbnailUrl = 'http://i.epvpimg.com/Tb3Pfab.png';
                }
            } else {
                const thumbnailUrls = {
                    'PLAY_ON_DESKTOP': 'http://i.epvpimg.com/qpSDeab.png',
                    'PLAY_ON_PLAYSTATION': 'http://i.epvpimg.com/OMwzfab.png',
                    'PLAY_ON_XBOX': 'http://i.epvpimg.com/NR84fab.png',
                    'STREAM_ON_DESKTOP': 'http://i.epvpimg.com/VKIkcab.png',
                    'WATCH_VIDEO': 'http://i.epvpimg.com/louReab.png',
                    'WATCH_VIDEO_ON_MOBILE': 'http://i.epvpimg.com/louReab.png'
                };
                thumbnailUrl = thumbnailUrls[questInfo.taskType] || 'http://i.epvpimg.com/Tb3Pfab.png';
            }

            await interaction.editReply({
                content: 'جاري تحميل معلومات الكويست...',
                ephemeral: true
            });

            const colorNumber = parseInt(embedColor.replace('#', ''), 16) || 2067276;
            const questUrl = `https://discord.com/quests/${questInfo.id}`;

            const sections = [];
            const textDisplays = [];
            const nameSection = new SectionBuilder()
                .setThumbnailAccessory(
                    new ThumbnailBuilder({ media: { url: thumbnailUrl } })
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Quest Name**\n${questInfo.name}`)
                );
            sections.push(nameSection);

            if (questInfo.description) {
                textDisplays.push(
                    new TextDisplayBuilder().setContent(`**Description**\n${questInfo.description}`)
                );
            }

            if (questInfo.gameTitle || questInfo.gamePublisher) {
                let gameInfo = '';
                if (questInfo.gameTitle) {
                    gameInfo += `**Game**\n${questInfo.gameTitle}\n`;
                }
                if (questInfo.gamePublisher) {
                    gameInfo += `**Publisher**\n${questInfo.gamePublisher}`;
                }
                textDisplays.push(
                    new TextDisplayBuilder().setContent(gameInfo.trim())
                );
            }

            if (questInfo.rewards && questInfo.rewards.length > 0) {
                let rewardsText = '**Rewards**\n';
                questInfo.rewards.forEach(reward => {
                    if (reward.type === 'orbs') {
                        rewardsText += `• ${reward.quantity} Orbs\n`;
                    }
                });
                textDisplays.push(
                    new TextDisplayBuilder().setContent(rewardsText.trim())
                );
            }

            textDisplays.push(
                new TextDisplayBuilder().setContent(`**Task Type**\n\`${questInfo.taskType}\``)
            );
            let timeRequired = '';
            if (questInfo.taskType === 'WATCH_VIDEO_ON_MOBILE' || questInfo.taskType === 'WATCH_VIDEO') {
                const minutes = Math.floor(questInfo.target / 60);
                const seconds = questInfo.target % 60;
                timeRequired = `**Time Required**\n${minutes}m ${seconds}s`;
            } else {
                const hours = Math.floor(questInfo.target / 60);
                const minutes = questInfo.target % 60;
                timeRequired = `**Time Required**\n${hours}h ${minutes}m`;
            }
            textDisplays.push(
                new TextDisplayBuilder().setContent(timeRequired)
            );

            let datesText = '';
            if (questInfo.startsAt) {
                const startsTimestamp = Math.floor(new Date(questInfo.startsAt).getTime() / 1000);
                datesText += `**Starts**\n<t:${startsTimestamp}:F>\n`;
            }
            if (questInfo.expiresAt) {
                const expiresTimestamp = Math.floor(new Date(questInfo.expiresAt).getTime() / 1000);
                datesText += `**Expires**\n<t:${expiresTimestamp}:F> (<t:${expiresTimestamp}:R>)`;
            }
            if (datesText) {
                textDisplays.push(
                    new TextDisplayBuilder().setContent(datesText.trim())
                );
            }

            const buttonSection = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('Open Quest')
                )
                .setButtonAccessory(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel("Open Quest")
                        .setURL(questUrl)
                );
            sections.push(buttonSection);

            const container = new ContainerBuilder()
                .setAccentColor(colorNumber)
                .addSectionComponents(...sections)
                .addTextDisplayComponents(...textDisplays);

            if (questInfo.heroImage) {
                const mediaGallery = new MediaGalleryBuilder()
                    .addItems(
                        new MediaGalleryItemBuilder()
                            .setURL(questInfo.heroImage)
                    );
                container.addMediaGalleryComponents(mediaGallery);
            }

            const components = [
                container,
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            ];

            let mentionMessage = '';
            switch (mentionType) {
                case '@everyone':
                    mentionMessage = '@everyone';
                    break;
                case '@here':
                    mentionMessage = '@here';
                    break;
                case 'none':
                default:
                    mentionMessage = '';
                    break;
            }

            try {
                const channel = targetChannel || interaction.channel;
                
                if (mentionMessage) {
                    await channel.send({
                        content: mentionMessage
                    });
                }
                
                await channel.send({
                    flags: MessageFlags.IsComponentsV2,
                    components: components
                });

                await interaction.editReply({
                    content: targetChannel ? `تم إرسال معلومات الكويست إلى ${targetChannel}` : 'تم إرسال معلومات الكويست بنجاح!',
                    ephemeral: true
                });
            } catch (sendError) {
                console.error('Error sending message:', sendError);
                await interaction.editReply({
                    content: 'تم تحميل الكويست بنجاح، لكن حصل خطأ أثناء الإرسال.',
                    ephemeral: true
                }).catch(() => {});
            }
        } catch (error) {
            console.error('Error fetching quest info:', error);
            await interaction.editReply({
                content: `خطأ: ${error.message}`,
                ephemeral: true
            }).catch(() => {});
        }
    }
};

async function getQuestInfoWithStatus(questId) {
    try {
        const token = config.tokenme;
        const cleanToken = token.replace(/["']/g, '');

        console.log(`Fetching quest config for ID: ${questId}`);

        const configResponse = await fetch(`https://discord.com/api/v9/quests/${questId}`, {
            method: 'GET',
            headers: {
                'Authorization': cleanToken,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!configResponse.ok) {
            throw new Error(`Failed to fetch quest config: ${configResponse.status}`);
        }

        const configData = await configResponse.json();
        
        console.log('═══════════════════════════════════════════════════');
        console.log('📥 RAW API RESPONSE - CONFIG DATA:');
        console.log('═══════════════════════════════════════════════════');
        console.log(JSON.stringify(configData, null, 2));
        console.log('═══════════════════════════════════════════════════');

        let userStatus = null;
        try {
            const statusResponse = await fetch(`https://discord.com/api/v9/quests/${questId}/user-status`, {
                method: 'GET',
                headers: {
                    'Authorization': cleanToken,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (statusResponse.ok) {
                userStatus = await statusResponse.json();
                console.log('═══════════════════════════════════════════════════');
                console.log('📥 RAW API RESPONSE - USER STATUS:');
                console.log('═══════════════════════════════════════════════════');
                console.log(JSON.stringify(userStatus, null, 2));
                console.log('═══════════════════════════════════════════════════');
            }
        } catch (statusError) {
            console.log('Could not fetch user status:', statusError.message);
        }

        const taskConfig = configData.task_config_v2 || configData.task_config;
        const taskType = Object.keys(taskConfig?.tasks || {})[0];
        const taskInfo = taskType ? taskConfig.tasks[taskType] : null;

        let description = '';
        if (taskType === 'WATCH_VIDEO_ON_MOBILE' || taskType === 'WATCH_VIDEO') {
            const minutes = Math.floor((taskInfo?.target || 0) / 60);
            const seconds = (taskInfo?.target || 0) % 60;
            description = `🎥 Watch video for ${minutes}m ${seconds}s to earn rewards!`;
        } else if (taskType === 'PLAY_ON_DESKTOP') {
            const hours = Math.floor((taskInfo?.target || 0) / 60);
            const minutes = (taskInfo?.target || 0) % 60;
            description = `🎮 Play for ${hours}h ${minutes}m to earn rewards!`;
        } else if (taskType === 'STREAM_ON_DESKTOP') {
            const hours = Math.floor((taskInfo?.target || 0) / 60);
            const minutes = (taskInfo?.target || 0) % 60;
            description = `📺 Stream for ${hours}h ${minutes}m to earn rewards!`;
        } else if (taskType === 'PLAY_ON_PLAYSTATION' || taskType === 'PLAY_ON_XBOX') {
            const hours = Math.floor((taskInfo?.target || 0) / 60);
            const minutes = (taskInfo?.target || 0) % 60;
            description = `🎮 Play on console for ${hours}h ${minutes}m to earn rewards!`;
        } else {
            description = `🎯 Complete the quest to earn rewards!`;
        }

        const rewards = configData.rewards_config?.rewards?.map(reward => {
            if (reward.type === 4) {
                return {
                    name: `${reward.orb_quantity} Orbs`,
                    type: 'orbs',
                    quantity: reward.orb_quantity
                };
            }
            return {
                name: reward.messages?.name || 'Unknown Reward',
                type: reward.type
            };
        }) || [];

        let heroImageUrl = null;
        if (configData.assets?.hero && typeof configData.assets.hero === 'string') {
            if (configData.assets.hero.startsWith('http')) {
                heroImageUrl = configData.assets.hero;
            } else {
                heroImageUrl = `https://cdn.discordapp.com/quests/${questId}/${configData.assets.hero.split('/').pop()}`;
            }
        }

        let fallbackImageUrl = null;
        if (configData.assets?.game_tile) {
            if (typeof configData.assets.game_tile === 'string' && configData.assets.game_tile.startsWith('http')) {
                fallbackImageUrl = configData.assets.game_tile;
            } else if (typeof configData.assets.game_tile === 'string') {
                fallbackImageUrl = `https://cdn.discordapp.com/quest-assets/${configData.assets.game_tile}`;
            }
        }

        const questInfo = {
            id: configData.id || questId,
            name: configData.messages?.quest_name || 'Unknown Quest',
            gameTitle: configData.messages?.game_title,
            gamePublisher: configData.messages?.game_publisher,
            status: userStatus?.completedAt ? '✅ Completed' :
                   userStatus?.enrolledAt ? '🟡 In Progress' : '⚪ Available',
            application: configData.application?.name || 'Unknown',
            taskType: taskType || 'Unknown',
            progress: userStatus?.progress?.[taskType]?.value || 0,
            target: taskInfo?.target || 0,
            enrolledAt: userStatus?.enrolledAt,
            completedAt: userStatus?.completedAt,
            expiresAt: configData.expires_at,
            startsAt: configData.starts_at,
            link: configData.application?.link || configData.cta_config?.link,
            heroImage: heroImageUrl || fallbackImageUrl,
            rewards: rewards,
            description: description,
            allAssets: configData.assets || {}
        };

        console.log('Processed quest info:', {
            id: questInfo.id,
            name: questInfo.name,
            heroImage: questInfo.heroImage,
            taskType: questInfo.taskType,
            status: questInfo.status
        });
        return questInfo;

    } catch (error) {
        console.error('Error in getQuestInfoWithStatus:', error);
        return null;
    }
}