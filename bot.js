const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1547181055994232923';
const GUILD_ID = '732632368111943680';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const commands = [
    new SlashCommandBuilder()
        .setName('abgame')
        .setDescription('Запустить игру на инверсию A/B')
        .addIntegerOption(option =>
            option
                .setName('rounds')
                .setDescription('Количество раундов')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(5)
        )
        .addStringOption(option =>
            option
                .setName('difficulty1')
                .setDescription('Сложность первого раунда')
                .setRequired(false)
                .addChoices(
                    { name: 'Легко', value: 'easy' },
                    { name: 'Средне', value: 'medium' },
                    { name: 'Сложно', value: 'hard' }
                )
        )
        .addStringOption(option =>
            option
                .setName('difficulty2')
                .setDescription('Сложность второго раунда')
                .setRequired(false)
                .addChoices(
                    { name: 'Легко', value: 'easy' },
                    { name: 'Средне', value: 'medium' },
                    { name: 'Сложно', value: 'hard' }
                )
        )
        .addStringOption(option =>
            option
                .setName('difficulty3')
                .setDescription('Сложность третьего раунда')
                .setRequired(false)
                .addChoices(
                    { name: 'Легко', value: 'easy' },
                    { name: 'Средне', value: 'medium' },
                    { name: 'Сложно', value: 'hard' }
                )
        )
        .addStringOption(option =>
            option
                .setName('difficulty4')
                .setDescription('Сложность четвёртого раунда')
                .setRequired(false)
                .addChoices(
                    { name: 'Легко', value: 'easy' },
                    { name: 'Средне', value: 'medium' },
                    { name: 'Сложно', value: 'hard' }
                )
        )
        .addStringOption(option =>
            option
                .setName('difficulty5')
                .setDescription('Сложность пятого раунда')
                .setRequired(false)
                .addChoices(
                    { name: 'Легко', value: 'easy' },
                    { name: 'Средне', value: 'medium' },
                    { name: 'Сложно', value: 'hard' }
                )
        )
        .addIntegerOption(option =>
            option
                .setName('timer')
                .setDescription('Ограничение времени в секундах')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(60)
        )
        .addIntegerOption(option =>
            option
                .setName('multiplier')
                .setDescription('Множитель сложности')
                .setRequired(false)
                .setMinValue(-100)
                .setMaxValue(100)
        )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log('Команда зарегистрирована!');
    } catch (error) {
        console.error(error);
    }
}

function generateSequence(length) {
    let sequence = '';

    for (let i = 0; i < length; i++) {
        sequence += Math.random() < 0.5 ? 'А' : 'Б';
    }

    return sequence;
}

function invertSequence(sequence) {
    return sequence
        .split('')
        .map(char => char === 'А' ? 'Б' : 'А')
        .join('');
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateMultiplier(multiplier) {
    const value = Math.abs(multiplier);

    if (value === 0) {
        return {
            symbolChange: 0,
            timerChange: 0
        };
    }

    const firstResult = Math.floor(value / 2);
    const secondResult = Math.ceil(firstResult / 2);

    return {
        symbolChange: multiplier > 0 ? -firstResult : firstResult,
        timerChange: multiplier > 0 ? secondResult : -secondResult
    };
}

client.once('clientReady', () => {
    console.log(`Выполнен вход как ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName !== 'abgame') return;

    const rounds = interaction.options.getInteger('rounds') || 1;
    const timer = interaction.options.getInteger('timer') || 10;
    const multiplier = interaction.options.getInteger('multiplier') || 0;

    const difficulties = [];

    for (let i = 1; i <= rounds; i++) {
        difficulties.push(
            interaction.options.getString(`difficulty${i}`) || 'medium'
        );
    }

    const difficultySettings = {
        easy: {
            name: 'Легко',
            sequenceLength: 10
        },
        medium: {
            name: 'Средне',
            sequenceLength: 17
        },
        hard: {
            name: 'Сложно',
            sequenceLength: 23
        }
    };

    const multiplierResult = calculateMultiplier(multiplier);
    const displayedMultiplier = multiplier >= 0 ? `+${multiplier}` : `${multiplier}`;

    await interaction.reply(
        `🔄 **Игра A/B начинается!**\n\n` +
        `Раундов: **${rounds}**\n` +
        `Время: **${timer} сек.**\n` +
        `Множитель сложности: **${displayedMultiplier}**`
    );

    await wait(1000);

    for (let round = 0; round < rounds; round++) {
        const difficulty = difficulties[round];
        const settings = difficultySettings[difficulty];

        const sequenceLength = Math.max(
            1,
            settings.sequenceLength + multiplierResult.symbolChange
        );

        const roundTimer = Math.max(
            1,
            timer + multiplierResult.timerChange
        );

        const embed = new EmbedBuilder()
            .setTitle('🔄 Игра A/B')
            .setDescription(
                `**Раунд:** ${round + 1}/${rounds}\n` +
                `**Сложность:** ${settings.name}\n` +
                `**Время:** ${roundTimer} сек.\n` +
                `**Множитель:** ${displayedMultiplier}\n\n` +
                '**Начало через... 5**'
            );

        const gameMessage = await interaction.channel.send({
            embeds: [embed]
        });

        for (let seconds = 4; seconds >= 1; seconds--) {
            await wait(1000);

            embed.setDescription(
                `**Раунд:** ${round + 1}/${rounds}\n` +
                `**Сложность:** ${settings.name}\n` +
                `**Время:** ${roundTimer} сек.\n` +
                `**Множитель:** ${displayedMultiplier}\n\n` +
                `**Начало через... ${seconds}**`
            );

            await gameMessage.edit({
                embeds: [embed]
            });
        }

        const sequence = generateSequence(sequenceLength);
        const answer = invertSequence(sequence);

        embed.setDescription(
            `**Раунд:** ${round + 1}/${rounds}\n` +
            `**Сложность:** ${settings.name}\n` +
            `**Время:** ${roundTimer} сек.\n` +
            `**Множитель:** ${displayedMultiplier}\n\n` +
            `## \`${sequence}\`\n\n` +
            `⏱️ **У вас ${roundTimer} сек.!**`
        );

        await gameMessage.edit({
            embeds: [embed]
        });

        const startTime = Date.now();

        const filter = message => {
            return (
                message.channel.id === interaction.channel.id &&
                !message.author.bot
            );
        };

        const collector = interaction.channel.createMessageCollector({
            filter,
            time: roundTimer * 1000
        });

        await new Promise(resolve => {
            collector.on('collect', async message => {
                const playerAnswer = message.content.trim().toUpperCase();

                if (playerAnswer === answer) {
                    const elapsed = (Date.now() - startTime) / 1000;

                    collector.stop('winner');

                    await interaction.channel.send(
                        `🎉 **${message.author} ответил первым!**\n\n` +
                        `Раунд: **${round + 1}/${rounds}**\n` +
                        `⏱️ Время: **${elapsed.toFixed(2)} сек.**`
                    );

                    resolve();
                    return;
                }

                await interaction.channel.send(
                    `❌ **${message.author} ответил неправильно!**\n` +
                    `Ответ: \`${message.content}\``
                );
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'winner') return;

                await interaction.channel.send(
                    `⏰ **Время вышло!**\n\n` +
                    `Раунд: **${round + 1}/${rounds}**\n` +
                    `Никто не успел дать правильный ответ.\n\n` +
                    `Правильный ответ: \`${answer}\``
                );

                resolve();
            });
        });

        if (round < rounds - 1) {
            await wait(1000);
        }
    }

    await interaction.channel.send(
        `🏁 **Все ${rounds} раунд${rounds === 1 ? '' : rounds < 5 ? 'а' : 'ов'} завершены!**`
    );
});

registerCommands();
client.login(TOKEN);