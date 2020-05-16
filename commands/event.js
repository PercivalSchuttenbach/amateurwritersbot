const ResourceManager = require('./event/ResourceManager');

const MOD_ROLE_ID = '635960624702029824';
const WARRIOR_ROLE_ID = '694788170927046677'
const IS_MOD = ({ member }) => member.roles.highest.id == MOD_ROLE_ID;

/** @var array **/
const SUB_COMMANDS = {
    'set': IS_MOD,
    'start': () => true,
    'stop': () => true,
    'dungeon': () => true,
    'type': () => true,
    'test': IS_MOD,
    'reload': IS_MOD,
    'help': () => true,
    'narrate': IS_MOD,
    'banter': IS_MOD
};

const DUNGEONS = {
    "test": "1ARcgeXxr_ARNUShlwvP0_vQdDwhkpkS-N7NxnYUfFwQ"
};

const SPRINT_BOTS = [
    {
        start_text: "JOIN THE SPRINT",
        join: /^_join/i,
        collect_start: "TIME'S UP",
        wc_text: /^_wc\s+\d+/i,
        collect_stop: "CONGRATS EVERYONE",
        writing: "THE SPRINT BEGINS"
    },
    {
        start_text: "A new sprint has been scheduled",
        join: /!sprint\sjoin/i,
        collect_start: "Time is up",
        wc_text: /^!sprint\s+wc\s+\d+/i,
        collect_stop: /Congratulations to everyone|No-one submitted their wordcounts/,
        writing: "Sprint has started"
    }
];

const ANON_ICON = "https://media.discordapp.net/attachments/652184396819857448/706831256700190780/anon.jpg";
const EMBED_FOOTER = { label: 'By: Book or Bust', value: 'https://media.discordapp.net/attachments/673284825167429642/673302072585748491/NewDashBanner.png?width=573&height=475' };

class Event
{

    constructor({ Client, Discord, Controller })
    {
        /** @var Discord **/
        this.Discord = Discord;
        /** @var Client **/
        this.Client = Client;
        /** @var Controller **/
        this.Controller = Controller;
        /** @var Channel **/
        this.channel = null;
        /** @var Channel **/
        this.sprintChannel = null;
        /** bot Message **/
        this.botMessage = null;
        /** @var Object **/
        this.listeners = {
            start: [],
            col: [],
            wc: [],
            stop: [],
            writing: [],
            join: []
        };
        /* Role */
        this.warriorRole = null;

        /** @var ResourceManager **/
        this.ResourceManager = new ResourceManager(this.sendFeedbackToChannel, this.removeAllListeners);
    }

    /**
     * Shows the help in an embed
     */
    async help()
    {
        const botName = this.Client.user.username;
        const embed = new this.Discord.MessageEmbed()
            .setTitle(`~Event help ~~aka the faq with your dungeon master~~`)
            .setDescription(`**Disclaimer**\nThe ${botName} bot is underdevelopment by Percy. Bugs can still creep up. If you find one send him a DM or ping him.\n\n"~event" is our D&D feature we use for sprinting dungeons or BoB marathon events.\n${botName} piggy backs on other sprint bots; currently only Sprinto (BudgetWb) and Writer Bot (WB) are supported. Which means you will need to run sprints manually using the available bot while the dungeon or event is running.`)
            .addField('\u200b', '**Commands**')
            .addField('~event dungeon [name]', 'Starts an existing dungeon. During the sprints the data will be saved to a Google Spreadsheet. Every time the same dungeon is started it will start from were it left of last time. After the dungeon has been completed it will reset itself. Currently available:\n> test : initial test dungeon. Contains random strings for narrative, but has pretty heavy bosses.')
            .addField('~event set [spreadsheet_id]', 'Using this method you can tell the bot to run a spreadsheet not available in the dungeon list. Marathon events will run this way. Sheets that are run this way will not be reset on completion. A Marathon event can be a one time thing, but they could become available as dungeons later.')
            .addField('~event start', 'The event can be started after **~event dungeon** or **~event set** has been used.')
            .addField(`~event type [**m** *or* **wc**]`, `Tells ${botName} that you are using minutes (**m**) or wordcount (**wc**) during your sprints.`)
            .addField('~event stop', 'Stops the event and removes it from memory. All data will still be available in the spreadsheet.')
            .addField('\u200b', '**Debugging**')
            .addField('~event reload', 'Reloads the event by using the last data saved to the spreadsheet. The event will keep running in the background.')
            .addField('~event test [**narrative** *or* **enemies**]', 'Shows you the narrative or enemies of the dungeon or event.')
            .setFooter(EMBED_FOOTER.label, EMBED_FOOTER.value);

        this.sendFeedbackToChannel(embed);
    }

    /**
    * @param string
    */
    handleError(err)
    {
        this.sendFeedbackToChannel(err, true);
    }

    /**
    * remove all listeners
    **/
    removeAllListeners()
    {
        for (var key in this.listeners) {
            this.removeListener(key);
        }
    }

    /**
     * Make sure no event is running
     */
    isNotRunning()
    {
        if (this.ResourceManager.running) throw `There is already an event in progress.`;
    }

    /**
     * Make sure an event is running
     */
    isRunning()
    {
        if (!this.ResourceManager.running) throw `There is no event running. See ~event help`;
    }

    /**
    * Send a new message or update an existing message to update user of status
    * 
    * @param string
    **/
    async sendFeedbackToChannel(text, direct = false)
    {
        if (this.silent) return console.log(text);
        if (this.botMessage && !direct) {
            await this.botMessage.edit(text)
                .then((message => this.botMessage = message).bind(this)).catch(err => console.log(err));
            return;
        }
        if (this.channel) {
            await this.channel.send(text)
                .then((message => this.botMessage = message).bind(this)).catch(err => console.log(err));
            return;
        }
        //@todo figure out what to do when no channel has been set
    }

    /**
    * @param Discord.Message.content
    * @return Object
    */
    getArgs({ content })
    {
        let command = '';
        //split string on spaces
        let args = content.slice(process.env.PREFIX.length).trim().split(/ +/g);
        if (args.length > 1) {
            //remove the command that initiated this model
            args.shift();
            command = args.shift().trim().toLowerCase();
        }

        return { command, args };
    }

    /**
    * Command function called from controller
    *
    * @param Discord.Message
    **/
    async event(message, silent=false)
    {
        this.channel = message.channel;
        this.silent = silent;

        //Get command and arguments and call subcommand
        let { command, args } = this.getArgs(message);
        //@todo make sure not all methods can be called from chat
        if (!SUB_COMMANDS[command]) {
            this.sendFeedbackToChannel('No valid subcommand given. Use "~event help".', true);
            return;
        }
        if (!SUB_COMMANDS[command](message)) {
            this.sendFeedbackToChannel('No permission to use this command.', true);
            return;
        }
        //retrieve warriorRole to assign later
        this.warriorRole = await message.guild.roles.fetch(WARRIOR_ROLE_ID);
        //execute subcommand method. On error catch and send to channel
        await this[command](message, args).catch(this.handleError.bind(this));
        this.silent = false;
        return;
    }

    /**
    * Start the event that has been set
    */
    async start(message, args)
    {
        this.isNotRunning();

        if (!this.ResourceManager.areThereEnemiesLeft()) {
            this.showEnd();
            return;
        }
        this.sprintChannel = this.channel;
        //this.sendFeedbackToChannel(`Adding listeners for sprint bots for sprint start`);
        //Add warriorRole to all sprinters
        this.getSprinters().forEach(({ member }) => member.roles.add(this.warriorRole));

        //Bind listeners for event
        SPRINT_BOTS.forEach(({ start_text, collect_start, collect_stop, writing, join }) =>
        {
            this.listeners.start.push(this.addListener(start_text, true, this.sprintInitiated));
            this.listeners.col.push(this.addListener(collect_start, true, this.listenForWc));
            this.listeners.stop.push(this.addListener(collect_stop, true, this.sumbitSprintWc));
            this.listeners.writing.push(this.addListener(writing, true, this.sprintBegins));
            this.listeners.join.push(this.addListener(join, false, this.joinSprint));
        });
        //flag the event as started and show begin
        this.ResourceManager.running = true;
        this.showBegin();

        this.Controller.save(message);
    }

    /**
     * Reload all event data from spreadsheet
     **/
    async reload()
    {
        await this.sendFeedbackToChannel(`Reloading event data.`, true);
        await this.ResourceManager.reload().catch(this.handleError.bind(this));
        this.sendFeedbackToChannel(`Event data reloaded.`);
    }

    /**
    * Stop and clear event
    **/
    async stop()
    {
        this.isRunning();

        this.removeAllListeners();
        this.ResourceManager.clearAllData();
        /*Remove warrior role from sprinters*/
        this.getSprinters().forEach(({ member }) => member.roles.remove(this.warriorRole));

        this.sendFeedbackToChannel(`Event has been stopped.`, true);
        /*Remove recovery state from database*/
        this.Controller.clearSaved(process.env.PREFIX + 'event');
        this.Controller.clearSaved(process.env.PREFIX + 'dungeon');
    }

    /**
     * Show available data from event
     * 
     * @param array args
     */
    async test(args)
    {
        if (args.length) throw `No data type given: *narratives* **or** *enemies*`;

        const [narratives, enemies] = this.resource.ResourceManager.get(['narratives', 'enemies']);

        if (!narratives.length || !enemies.length) throw `There is no data available to show.`;

        switch (args[0]) {
            case "narrative":
                narratives.forEach(narrative => this.showNarrative(narrative));
                break;
            case "enemies":
                enemies.forEach(enemy => this.showEnemy(enemy, false));
                break;
        }
    }

    /**
    * Is called when sprint is initiated
    **/
    sprintInitiated()
    {
        this.nextNarrative();
    }

    /**
    * Get and show the next narrative based on total wordcount written
    */
    nextNarrative()
    {
        const [ sprinters, narratives, enemies ] = this.resource.ResourceManager.get(['sprinters', 'narratives', 'enemies']);
        const narrative = narratives.find(({ shown }) => !shown);
        const wordcount = sprinters.reduce((a, b) => a + b.wordcount, 0);
        const test = { enemies, wordcount };

        const conditions = narrative.conditions.matchAll(/([a-z]+)=([0-9]+):?(([0-9]+)(%)?)?/g);
        const show = Array.from(conditions).every(([, entity, value, ,value2, percentage]) =>
        {
            if (value2) {
                value2 = percentage ? value2 / 100 : parseInt(value2);
                let { health, wordcount } = test[entity][value-1];
                return health / wordcount <= value2;
            }
            return test[entity] >= parseInt(value);
        });

        if (show) this.showNarrative(narrative);
    }

    /**
     * @param Message
     * @return void
     */
    joinSprint({ content, author })
    {
        const match = content.match(/(\d+|same)/);
        const wc = match ? match[0] : 0;

        let { sprinter, joined } = this.getSprinter(author);
        sprinter.setSprintStartWc(wc);

        if(joined) this.joinedTheFray(author, sprinter);
    }

    /**
    * Bind listeners to the Controller for all posible bot wc commands
    **/
    listenForWc()
    {
        this.sendFeedbackToChannel(`Listening for sprint bots for wc`,true);

        SPRINT_BOTS.forEach(({ wc_text }) =>
        {
            this.listeners.wc.push(this.addListener(wc_text, false, this.processSprintWc));
        });
    }

    /**
    * @param RegEx|string, bool, fn
    */
    addListener(pattern, isBot, callback)
    {
        return this.Controller.listenTo(pattern, this.channel.id, isBot, callback.bind(this));
    }

    /**
    * Tell the Controller to stop listening to wc commands
    **/
    removeListener(type)
    {
        while (this.listeners[type].length > 0) {
            this.Controller.stopListeningTo(this.listeners[type].shift());
        }
    }

    /**
    * @param Message
    */
    processSprintWc({ content, author })
    {
        const match = content.match(/(\d+)\s?(new)?/);
        if (match) {
            const [, wordcount, newFlag] = match;
            let { sprinter } = this.getSprinter(author);
            sprinter.setSprintWc(wordcount, newFlag);
            this.sendFeedbackToChannel(`${author.username}: ${wordcount} ${newFlag ? newFlag: ''}`, true);
        }
    }


    /**
    * Sprint bot collected all wordcount from sprinters
    */
    async sumbitSprintWc()
    {
        this.removeListener('wc');

        const sprinters = await this.getCurrentSprinters();
        await this.commit();
        if (!this.areThereEnemiesLeft()) {
            return this.end();
        }
        this.showSprinters(sprinters);
    }

    /**
    * Event has ended on its own. Clear listeners
    */
    end()
    {
        this.removeAllListeners();
        this.showEnd();
        this.showSprinters(this.getSprinters());
    }

    /**
    * Show end narrative of the event
    */
    showEnd()
    {
        this.showNarrative(this.ResourceManager.get('narratives', -1));
    }

    /**
    * Show begin narrative of the event
    **/
    async showBegin()
    {
        await this.showNarrative(this.ResourceManager.get('narratives', 0));
        await this.showEnemies();
    }


    /**
    * Wordcount collected by sprint bot. Commit all data.
    */
    async commit()
    {
        let totalWcCurrentSprint = 0;
        //Map sprinter data to array for spreadsheet
        const sprintersData = this.ResourceManager.get('sprinters').map((sprinter) =>
        {
            //collect total wc sprint and commit the wc for sprinters
            totalWcCurrentSprint += sprinter.sprintWc;
            sprinter.commit();
            return sprinter.toArray();
        });

        this.updateEnemy(totalWcCurrentSprint);

        //Map enemies data to array for spreadsheet
        const enemiesData = this.ResourceManager.get('enemies').map(enemy => enemy.toArray());
        //Map narratives data to array for spreadsheet
        const narrativesData = this.ResourceManager.get('narratives').map(narrative => narrative.toArray());

        //update sheets on spreadsheet
        await this.ResourceManager.updateResource('sprinters', DATA_RANGES.sprinters, sprintersData);
        await this.ResourceManager.updateResource('enemies', DATA_RANGES.enemies, enemiesData);
        await this.ResourceManager.updateResource('narratives', DATA_RANGES.narratives, narrativesData);
    }

    /**
     * @return Enemy
     */
    getCurrentEnemy()
    {
        return this.ResourceManager.get('enemies').find(({ defeated }) => !defeated);
    }

    /**
    * Update current enemy in battle
    *
    * @param int
    */
    updateEnemy(wordcount = 0)
    {
        let currentEnemy = this.getCurrentEnemy();
        if (currentEnemy) {
            currentEnemy.takeDamage(wordcount);
            this.showEnemy(currentEnemy, true);
            if (currentEnemy.defeated) this.showEnemies();
            return;
        }
        throw `Event had already ended`;
    }

    /**
    * Show enemy at start of sprint
    */
    sprintBegins()
    {
        let currentEnemy = this.getCurrentEnemy();
        if (currentEnemy) {
            this.showEnemy(currentEnemy, false);
        }
    }

    /**
    * Set user type
    *
    * @param array
    * @param Message
    */
    async type(message, args)
    {
        this.isRunning();

        if (!args.length || !["m", "wc"].includes(args[0])) {
            throw `No type supplied "~event type *m* **or** *wc*" m for minutes or wc for wordcount`;
        }
        let { sprinter } = this.getSprinter(message.author);
        sprinter.setType(args[0]);
        this.sendFeedbackToChannel(`Your sprint type has been set to ${args[0] === 'm' ? 'minutes' : 'wordcount'}`, true);
    }

    /**
    * @param author
    */
    getSprinter(author)
    {
        //@todo refactor using ResourceManager
        const sprinter = this.ResourceManager.get('sprinters', ({ id }) => id === author.id);
        let joined = false;
        if (!sprinter) {
            //Sprinter is not in eventData yet. Add it
            const member = this.channel.members.get(author.id);
            member.roles.add(this.warriorRole);

            this.ResourceManager.addSprinter(author.id, member);
            joined = true;
        }
        return { sprinter, joined };
    }

    /**
    * RESOURCE MANAGEMENT
    */

    /**
    * Run premade Event from DUNGEONS list
    * @param array
    * 
    * @todo alias to ~dungeon
    */
    async dungeon(message, args)
    {
        this.isNotRunning();

        if (!args.length) {
            throw `No dungeon was supplied. See ~event help.`;
        }
        let dungeon = DUNGEONS[args[0]];
        if (!dungeon) {
            throw `Dungeon does not exist. See ~event help.`;
        }
        this.dungeonRunning = true;

        //set expects an array of arguments
        await this.set(message, [dungeon]).catch(this.handleError.bind(this));
        if (!this.areThereEnemiesLeft() && this.dungeonRunning) {
            await this.resetDungeon();
        }
        await this.sendFeedbackToChannel(`Dungeon has been set up! Start with "~event start" and use one of the Sprint bots =)`);
        this.Controller.save(message);
    }

    /**
    * Setup event using google spreadsheet
    *
    * @param array
    **/
    async set(message, args)
    {
        if (this.ResourceManager.running || this.ResourceManager.settingUp) {
            throw `An event is already running or being setup.`;
        }
        if (args.length) {
            await this.ResourceManager.set(args[0]).catch(this.handleError.bind(this));

            //get the sprinters and tie member data from the channel
            this.ResourceManager.get('sprinters').
                forEach(sprinter =>
                {
                    const member = this.channel.members.get(sprinter.id);
                    if (member) {
                        sprinter.member = member;
                        sprinter.name = member.displayName;
                        sprinter.thumbnail = member.user.avatarURL();
                    }
                });
            //a dungeon saves its own state
            if (!this.ResourceManager.dungeonRunning) this.Controller.save(message);
            return;
        }
        throw 'No spreadsheetId supplied. Try again with "~event set [google spreadsheet id]"';
    }

    /**
    * Resets the spread sheet and objects for new sprinters
    **/
    async resetDungeon()
    {
        this.sendFeedbackToChannel(`Clearing old event data...`);
        // remove all sprinters
        this.ResourceManager.clearResource('sprinters', DATA_RANGES.sprinters);
        //Map enemies data to array for spreadsheet
        const enemiesData = this.ResourceManager.get('enemies').map(enemy => enemy.reset().toArray());
        //Map narratives data to array for spreadsheet
        const narrativesData = this.ResourceManager.get('narratives').map(narrative => narrative.reset().toArray());

        //update sheets on spreadsheet
        await this.ResourceManager.updateResource('enemies', DATA_RANGES.enemies, enemiesData);
        await this.ResourceManager.updateResource('narratives', DATA_RANGES.narratives, narrativesData);
    }

    /**
    * @param Enemy
    */
    showEnemy(enemy, isBattle)
    {
        const embed = new this.Discord.MessageEmbed()
            .setTitle(enemy.name)
            .setDescription(enemy.getDescription(isBattle))
            .setImage(enemy.image)
            .setThumbnail(enemy.thumbnail)
            .addField('Health', enemy.healthbar, true)
            .addField('Wordcount', enemy.health + ' / ' + enemy.wordcount, true)
            .setFooter(EMBED_FOOTER.label, EMBED_FOOTER.value);

        this.sprintChannel.send(embed);
    }

    /**
     * Show list of enemies still needed to beat
     * */
    async showEnemies()
    {
        await this.sprintChannel.send('Enemies:');
        this.ResourceManager.get('enemies').forEach(async ({ name, health, wordcount, healthbar, thumbnail }, key, enemies) =>
        {
            if ((key > 0 && !enemies[key - 1].defeated) || health === wordcount) {
                thumbnail = null;
                name = name.replace(/./gi, '?');
                health = `${health}`.replace(/[0-9]/gi, '?');
                wordcount = `${wordcount}`.replace(/[0-9]/gi,'?');
            }

            const embed = new this.Discord.MessageEmbed()
                .setAuthor(name, thumbnail)
                .addField('Health', healthbar, true)
                .addField('Wordcount', `${health}/${wordcount}`, true);

            await this.sprintChannel.send(embed);
        });
    }


    /**
    * @param Narrative
    */
    showNarrative(narrative)
    {
        const embed = new this.Discord.MessageEmbed()
            .setTitle(narrative.title)
            .setDescription(narrative.text)
            .setImage(narrative.image)
            .setThumbnail(narrative.icon ? narrative.icon : ANON_ICON)
            .setFooter(EMBED_FOOTER.label, EMBED_FOOTER.value);

        narrative.setShown();

        this.sprintChannel.send(embed);
    }

    /**
    * Show list of current sprinters
    */
    async showSprinters(sprinters)
    {
        if (sprinters.length) {
            await this.sprintChannel.send('Our heroes:');
            sprinters.sort((a, b) => b.wordcount - a.wordcount)
                .forEach(async ({ name, wordcount, icon, thumbnail }) =>
                {
                    const embed = new this.Discord.MessageEmbed().setAuthor(`${name} ${icon} — ${wordcount}`, thumbnail);
                    await this.sprintChannel.send(embed);
                });
        }

    }

    /**
     * @return array
     */
    async getCurrentSprinters()
    {
        return this.ResourceManager.filter('sprinters', (sprinter) => sprinter.sprintWc);
    }

    /**
     * @return array
     */
    getSprinters()
    {
        return this.ResourceManager.get('sprinters');
    }

    /**
     * Check if an event is running and if the user has permission to run the command
     * 
     * @param string command
     * @param Message message
     */
    async hasAccess(command, message)
    {
        try {
            this.isRunning()
        } catch (err) {
            return this.sendFeedbackToChannel(err, true);
        }

        if (!SUB_COMMANDS[command](message)) return this.sendFeedbackToChannel('No permission to use this feature.', true);
    }

    /**
     *  Send message as the narrator to the sprint channel
     *
     * @param array args
     * @param Message message
     */
    async narrate(message)
    {
        this.hasAccess('narrate', message);

        const { content, channels } = this.stripMessageForInteraction(message, 'narrate');
        this.sendInteraction(channels, content, "Narrator", ANON_ICON);
    }

    /**
    *  Send message as the enemy to the sprint channel
    *
    * @param array args
    * @param Message message
    */
    async banter(message)
    {
        this.hasAccess('banter', message);

        const { name, thumbnail } = this.getCurrentEnemy();
        const { content, channels } = this.stripMessageForInteraction(message, 'banter');

        this.sendInteraction(channels, content, name, thumbnail);
    }

    /**
     * Remove channel mentions and command
     * 
     * @param {any} message
     */
    stripMessageForInteraction(message, command)
    {
        let { content, mentions } = message;

        //strip command and channel mentions
        content = content
            .replace(/<#[0-9]+>/g, '')
            .replace(`${process.env.PREFIX}${command} `, '');

        return {content, channels:mentions.channels};
    }


    /**
     * Send interaction as an embed to the sprint channel
     * 
     * @param string content
     * @param string name
     * @param string thumbnail
     */
    sendInteraction(channels, content, name, thumbnail)
    {
        const embed = new this.Discord.MessageEmbed()
            .setDescription(content)
            .setTitle(name)
            .setThumbnail(thumbnail);
        //send to channels mentioned in original message
        if (channels.size) {
            return channels.forEach(channel => channel.send(embed));
        }
        this.sprintChannel.send(embed);
    }

    /**
     * Show who has joined the party
     *
     * @param {any} author
     */
    joinedTheFray(author, sprinter)
    {
        const embed = new this.Discord.MessageEmbed()
            .setAuthor(`${sprinter.name} ${sprinter.icon}`, author.avatarURL())
            .setDescription('Has joined the fray! ⚔️');
        this.sprintChannel.send(embed);
    }

}

module.exports = {
    name: 'Event',
    description: 'Running an event that uses the Sprint Bots',
    validate: function (message)
    {
        return true;
    },
    init: async function (resources)
    {
        return new Event(resources);
    }
};