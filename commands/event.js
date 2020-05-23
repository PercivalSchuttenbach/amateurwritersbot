//@todo move Sprinter and all related methods to SprintManager

const GoogleApi = require('../app/googleapi');
const { google } = require('googleapis');
const Enemy = require('./event/enemy');
const SprintManager = require('./event/SprintManager');
const Narrative = require('./event/narrative');

const MOD_ROLE_ID = '635960624702029824';
const WARRIOR_ROLE_ID = '694788170927046677';
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
    'banter': IS_MOD,
    'stats': () => true,
    'rejuvenate': IS_MOD,
    'countdown': ()=> true
};

const DUNGEONS = {
    "test": "1ARcgeXxr_ARNUShlwvP0_vQdDwhkpkS-N7NxnYUfFwQ",
    "GoblinRaid": "13IY8v1qH9IdZBT61XTjrW6EodyQX_NzCWRzYypZQ9wA"
};


const DATA_RANGES = {
    sprinters: 'Sprinters!A2:E',
    enemies: 'Enemies!A2:G',
    narratives: 'Narrative!A2:F',
    sprints: 'Sprints!A2:D'
};

const SPRINT_BOTS = [
    {
        start_text: "JOIN THE SPRINT",
        join: /^_join/i,
        collect_start: "TIME'S UP",
        wc_text: /^_wc\s+\d+/i,
        collect_stop: "CONGRATS EVERYONE",
        writing: "THE SPRINT BEGINS",
        cancel: "The sprint has been called off.",
        leave: /^_leave/i
    },
    {
        start_text: "A new sprint has been scheduled",
        join: /!sprint\sjoin/i,
        collect_start: /Time is up|Waiting for word counts/,
        wc_text: /^!sprint\s+wc\s+\d+/i,
        collect_stop: /Congratulations to everyone|No-one submitted their wordcounts/,
        writing: "Sprint has started",
        cancel: "Sprint has been cancelled",
        leave: /^!sprint\sleave/i
    }
];

const ANON_ICON = "https://media.discordapp.net/attachments/652184396819857448/706831256700190780/anon.jpg";
const EMBED_FOOTER = { label: 'By: Book or Bust', value: 'https://media.discordapp.net/attachments/673284825167429642/673302072585748491/NewDashBanner.png?width=573&height=475' };

class Event
{

    constructor({ Client, Discord, Controller })
    {
        /** @var array **/
        this.eventData = {
            enemies: [],
            narratives: []
        };
        /** @var Discord **/
        this.Discord = Discord;
        /** @var Client **/
        this.Client = Client;
        /** @var Controller **/
        this.Controller = Controller;
        /** @var bool **/
        this.settingUp = false;
        /** @var bool **/
        this.running = false;
        /** @var google.sheets **/
        this.sheets = null;
        /** @var Channel **/
        this.channel = null;
        /** @var Channel **/
        this.sprintChannel = null;
        /** bot Message **/
        this.botMessage = null;
        /** @var string **/
        this.spreadsheetId = null;
        /** @var string **/
        this.title = null;
        /** @var bool **/
        this.dungeonRunning = false;
        /** @var Object **/
        this.listeners = {
            start: [],
            col: [],
            wc: [],
            stop: [],
            writing: [],
            join: [],
            cancel: [],
            leave: []
        };
        /** @var role **/
        this.warriorRole = null;
        /** @var SprintManager **/
        this.SprintManager = new SprintManager();
    }

    /**
    * @param string
    */
    handleError(err)
    {
        this.sendFeedbackToChannel(err, true);
    }

    /**
    * @param string
    */
    handleSetupError(err)
    {
        this.clearAllData();
        this.removeAllListeners();
        this.handleError(err);
    }

    /**
    * Clear all data for event
    */
    clearAllData()
    {
        this.settingUp = false;
        this.running = false;
        this.eventData = {
            enemies: [],
            narratives: []
        }
        this.spreadsheetId = null;
        this.botMessage = null;
        this.title = null;
        this.dungeonRunning = false;
        this.SprintManager.clear();
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
    * Event has been setup but not running yet
    */
    isSetupgButNotRunning()
    {
        if (!this.settingUp) throw `There is no event setup yet. See ~event help.`;
        this.isNotRunning();
    }

    /**
     * Make sure no event is running
     */
    isNotRunning()
    {
        if (this.running) throw `There is already an event in progress.`;
    }

    /**
     * Make sure an event is running
     */
    isRunning()
    {
        if (!this.running) throw `There is no event running. See ~event help`;
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
    async event(message, silent = false)
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
        this.warriorRole = await message.guild.roles.fetch(WARRIOR_ROLE_ID);
        //execute subcommand method. On error catch and send to channel
        //@todo remove all data on exception
        await this[command](message, args).catch(this.handleError.bind(this));
        this.silent = false;
        return;
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
            .addField('~event dungeon [name]', 'Starts an existing dungeon. During the sprints the data will be saved to a Google Spreadsheet. Every time the same dungeon is started it will start from were it left of last time. After the dungeon has been completed it will reset itself. Currently available:\n> test : initial test dungeon. Contains random strings for narrative, but has pretty heavy bosses.\n> GoblinRaid A town raided by goblins')
            .addField('~event start', 'The event can be started after **~event dungeon** or **~event set** has been used.')
            .addField(`~event type [**m** *or* **wc**]`, `Tells ${botName} that you are using minutes (**m**) or wordcount (**wc**) during your sprints.`)
            .addField('~event stop', 'Stops the event and removes it from memory. All data will still be available in the spreadsheet.')
            .addField('~event stats', 'Show current event stats.')
            .addField('\u200b', '**Mod Only**')
            .addField('~event set [spreadsheet_id]', 'Using this method you can tell the bot to run a spreadsheet not available in the dungeon list. Marathon events will run this way. Sheets that are run this way will not be reset on completion. A Marathon event can be a one time thing, but they could become available as dungeons later.')
            .addField('~event reload', 'Reloads the event by using the last data saved to the spreadsheet. The event will keep running in the background.')
            .addField('~event test [**narrative** *or* **enemies**]', 'Shows you the narrative or enemies of the dungeon or event.')
            .addField('~event rejuvenate [wordcount]', 'Rejuvenates current enemy with given wordcount.')
            .addField('~event banter [message]', 'Send a message to sprint channel (or channels mentioned) as the current enemy.')
            .addField('~event narrate [message]', 'Send a message to sprint channel (or channels mentioned) as the Narrator.')
            .setFooter(EMBED_FOOTER.label, EMBED_FOOTER.value);

        this.sendFeedbackToChannel(embed, true);
    }

    /**
    * Start the event that has been set
    */
    async start(message, args)
    {
        this.isSetupgButNotRunning();

        if (!this.areThereEnemiesLeft()) {
            this.showEnd();
            return;
        }
        this.sprintChannel = this.channel;
        //this.sendFeedbackToChannel(`Adding listeners for sprint bots for sprint start`);

        //Bind listeners for event
        SPRINT_BOTS.forEach(({ start_text, collect_start, collect_stop, writing, join, cancel, leave }) =>
        {
            this.listeners.start.push(this.addListener(start_text, true, this.sprintInitiated));
            this.listeners.cancel.push(this.addListener(cancel, true, this.sprintCanceled));
            this.listeners.col.push(this.addListener(collect_start, true, this.listenForWc));
            this.listeners.stop.push(this.addListener(collect_stop, true, this.sumbitSprintWc));
            this.listeners.writing.push(this.addListener(writing, true, this.sprintBegins));
            this.listeners.join.push(this.addListener(join, false, this.joinSprint));
            this.listeners.leave.push(this.addListener(leave, false, this.leaveSprint));
        });
        //flag the event as started and show begin
        this.running = true;
        this.showBegin();

        this.Controller.save(message);
    }

    /**
     * Reload all event data from spreadsheet
     **/
    async reload()
    {
        await this.sendFeedbackToChannel(`Reloading event data.`, true);
        await this.setUp().catch(this.handleSetupError);
        this.sendFeedbackToChannel(`Event data reloaded.`);
    }

    /**
    * Stop and clear event
    **/
    async stop()
    {
        if (!this.running && !this.settingUp) throw `No event to stop.`;

        this.SprintManager.getSprinters().forEach(({ member }) => member.roles.remove(this.warriorRole));

        if (this.sprintChannel) this.enemyInteraction("Yes give up. Go back were you came from. Ta-ta!");

        this.removeAllListeners();
        this.clearAllData();
        this.sendFeedbackToChannel(`Event has been stopped.`, true);
        this.Controller.clearSaved(process.env.PREFIX + 'event');
        this.Controller.clearSaved(process.env.PREFIX + 'dungeon');
    }

    /**
     * Show available data from event
     * 
     * @param array args
     */
    async test(message, args)
    {
        const { narratives, enemies } = this.eventData;

        if (!args.length) throw `No data type given: *narratives* **or** *enemies*`;
        if (!narratives.length || !enemies.length) throw `There is no data available to show.`;

        if (!this.sprintChannel) this.sprintChannel = message.channel;

        switch (args[0]) {
            case "narrative":
                narratives.forEach(narrative => this.showNarrative(narrative));
                break;
            case "enemies":
                enemies.forEach(enemy => this.showEnemy(enemy, false));
                break;
            case "flow":
                this.testFlow();
                break;
        }
    }

    /**
     * Test narrative flow
     */
    async testFlow()
    {
        const { narratives, enemies } = this.eventData;
        const test = { ...this.eventData, wordcount: 0 };

        narratives.forEach(narrative =>
        {
            const conditions = narrative.conditions.matchAll(/([a-z]+)=([0-9]+):?(([0-9]+)(%)?)?/g);
            Array.from(conditions).every(([, entity, value, , value2, percentage]) =>
            {
                if (value2) {
                    const enemy = test[entity][value - 1];
                    const points = parseInt(value2);
                    const damage = percentage ? ((100 - points) / 100) * enemy.wordcount : (points === 0 ? enemy.health : points);
                    //show before death
                    if (enemy.wordcount === enemy.health && enemy.health === damage) this.showEnemy(enemy);
                    //this.sendFeedbackToChannel(`H${health} WC:${wordcount} V:${value2}`, true);
                    enemy.takeDamage(damage);
                    this.showEnemy(enemy);
                    return true;
                }
                //this.sendFeedbackToChannel(`${entity}: ${value}`, true);
                if (test[entity] !== value) {
                    //decrease enemies
                }
                return true;
            });
            this.showNarrative(narrative);
        });
    }

    /**
    * Is called when sprint is initiated
    **/
    sprintInitiated()
    {
        this.nextNarrative();
    }

    /**
    * Sprint was canceled remove Warriors role
    */
    sprintCanceled()
    {
        this.SprintManager.getSprinters().forEach(({ member }) => member.roles.remove(this.warriorRole));
        this.enemyInteraction("Giving up already? What a shame. Calls themselves writers... Go back to procrastinating!");
    }

    /**
    * Get and show the next narrative based on total wordcount written
    */
    nextNarrative()
    {
        const { narratives } = this.eventData;
        const narrative = narratives.find(({ shown }) => !shown);
        const wordcount = this.SprintManager.totalWc;
        const test = { ...this.eventData, wordcount };

        const conditions = narrative.conditions.matchAll(/([a-z]+)=([0-9]+):?(([0-9]+)(%)?)?/g);
        const show = Array.from(conditions).every(([, entity, value, , value2, percentage]) =>
        {
            if (value2) {
                value2 = percentage ? value2 / 100 : parseInt(value2);
                let { health, wordcount } = test[entity][value - 1];
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
        sprinter.member.roles.add(this.warriorRole);

        if (joined) this.joinedTheFray(author, sprinter);
    }

    /**
     * Sprinter leaves
     * 
     * @param {any} param0
     */
    leaveSprint({ member })
    {
        member.roles.remove(this.warriorRole);
        this.enemyInteraction("Pha! Coward. Come back, whenever. I'll be waiting...");
    }

    /**
    * Bind listeners to the Controller for all posible bot wc commands
    **/
    listenForWc()
    {
        this.sprintChannel.send(`Listening for sprint bots for wc`);

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
            this.sprintChannel.send(`${author.username}: ${wordcount} ${newFlag ? newFlag : ''}`);
        }
    }


    /**
    * Sprint bot collected all wordcount from sprinters
    */
    async sumbitSprintWc()
    {
        this.removeListener('wc');

        await this.commit();
        if (!this.areThereEnemiesLeft()) {
            return this.end();
        }
        const sprinters = await this.SprintManager.getCurrentSprinters();
        this.showSprinters(sprinters.sort((a, b) => b.sprintWc - a.sprintWc));

        sprinters.forEach(({ member }) => member.roles.remove(this.warriorRole));
    }

    /**
    * Check if there are still enemies left
    *
    * @return bool
    */
    areThereEnemiesLeft()
    {
        return this.eventData.enemies.find(({ defeated }) => !defeated);
    }

    /**
    * Event has ended on its own. Clear listeners
    */
    end()
    {
        this.removeAllListeners();
        this.showEnd();
        this.stats();
    }

    /**
    * Show end narrative of the event
    */
    showEnd()
    {
        const narratives = this.eventData.narratives;
        this.showNarrative(narratives[narratives.length - 1]);
    }

    /**
    * Show begin narrative of the event
    **/
    async showBegin()
    {
        await this.showNarrative(this.eventData.narratives[0]);
        await this.showEnemies();
    }


    /**
    * Wordcount collected by sprint bot. Commit all data.
    */
    async commit()
    {
        const totalWc = this.SprintManager.addSprint(this.getCurrentEnemy().id).getTotalWc();
        //Map sprinter data to array for spreadsheet
        const sprintersData = this.SprintManager.sprintersData;

        this.updateEnemy(totalWc);

        //Get Srpints data
        const sprintsData = this.SprintManager.sprintsData;
        //Map enemies data to array for spreadsheet
        const enemiesData = this.eventData.enemies.map(enemy => enemy.toArray());
        //Map narratives data to array for spreadsheet
        const narrativesData = this.eventData.narratives.map(narrative => narrative.toArray());

        //update sheets on spreadsheet
        await this.updateResource('sprinters', DATA_RANGES.sprinters, sprintersData);
        await this.updateResource('enemies', DATA_RANGES.enemies, enemiesData);
        await this.updateResource('narratives', DATA_RANGES.narratives, narrativesData);
        await this.updateResource('sprints', DATA_RANGES.sprints, sprintsData);
    }

    /**
     * @return Enemy
     */
    getCurrentEnemy()
    {
        return this.eventData.enemies.find(({ defeated }) => !defeated);
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
    getSprinter({ id: author_id })
    {
        let sprinter = this.SprintManager.getSprinter(author_id);
        let joined = false;
        if (!sprinter) {
            //Sprinter is not in eventData yet. Add it
            const member = this.channel.members.get(author_id);
            sprinter = this.SprintManager.addSprinter(author_id, member);
            joined = true;
        }
        return { sprinter, joined };
    }

    /**
    * RESOURCE MANAGEMENT
    */

    /**
    * Attempt to autenticate with google
    */
    async authenticateWithGoogle()
    {
        if (this.sheets) return;
        this.sendFeedbackToChannel('Authenticating with Google Spreadsheets...', true);

        const auth = (await new Promise(GoogleApi.getAuth.bind(GoogleApi)).then(this.setAuth.bind(this)).catch((err) => { console.log(err); throw `Could not authenticate with Google Spreadsheets.` }));
    }

    /**
    * Set sheets property and add auth to Google Sheets API
    *
    * @param oAuth2Client
    */
    setAuth(auth)
    {
        this.sheets = google.sheets({ version: 'v4', auth });
    }

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
        try {
            await this.set(message, [dungeon]);
        } catch (e) {
            this.handleSetupError(e);
            return;
        }
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
        if (this.running || this.settingUp) {
            throw `An event is already running or being setup.`;
        }
        await this.authenticateWithGoogle();
        if (args.length) {
            await this.sendFeedbackToChannel(`Retrieving Event spreadsheet...`, true);

            this.settingUp = true;
            this.spreadsheetId = args[0];

            if (!(await this.checkIfSpreadSheetExists(this.spreadsheetId))) {
                this.clearAllData();
                throw 'SpreadsheetId supplied does not exist. "Try again with "~event set [google spreadsheet id]"';
            }
            await this.setUp();
            if (!this.dungeonRunning) this.Controller.save(message);
            return;
        }
        throw 'No spreadsheetId supplied. Try again with "~event set [google spreadsheet id]"';
    }

    /**
    * Try to get the spreadsheet through the google api to check if it exists 
    *
    * @param string
    **/
    async checkIfSpreadSheetExists()
    {
        try {
            const request = { spreadsheetId: this.spreadsheetId, includeGridData: false };
            const { properties } = (await this.sheets.spreadsheets.get(request)).data;

            this.title = properties.title;
            this.sendFeedbackToChannel(`Found ${properties.title}. Will set up the event now...`);
        } catch (err) {
            return false;
        }
        return true;
    }

    /**
    * Initialize Event
    *
    * @param string
    **/
    async setUp()
    {
        await this.getResource(Enemy, 'enemies', DATA_RANGES.enemies);
        this.eventData.enemies.forEach((enemy, index) => enemy.id = index + 1);

        if (!this.areThereEnemiesLeft() && !this.dungeonRunning) throw `This event already took place. Reset or choose another.`;

        await this.getResource(Narrative, 'narratives', DATA_RANGES.narratives);
        await this.getResource(null, 'sprinters', DATA_RANGES.sprinters);
        this.SprintManager.addMemberData(this.channel.members);
        await this.getResource(null, 'sprints', DATA_RANGES.sprints);

        await this.sendFeedbackToChannel(`Event ${this.title} has been setUp! Start with "~event start" and use one of the Sprint bots =)`);
    }

    /**
    * Resets the spread sheet and objects for new sprinters
    **/
    async resetDungeon()
    {
        this.sendFeedbackToChannel(`Clearing old event data...`);
        // remove all sprinters
        this.clearResource('sprinters', DATA_RANGES.sprinters);
        this.clearResource('sprints', DATA_RANGES.sprints);
        this.SprintManager.clear();
        //Map enemies data to array for spreadsheet
        const enemiesData = this.eventData.enemies.map(enemy => enemy.reset().toArray());
        //Map narratives data to array for spreadsheet
        const narrativesData = this.eventData.narratives.map(narrative => narrative.reset().toArray());

        //update sheets on spreadsheet
        await this.updateResource('enemies', DATA_RANGES.enemies, enemiesData);
        await this.updateResource('narratives', DATA_RANGES.narratives, narrativesData);
    }

    /**
    * set resource by using spreadsheet
    *
    * @param class
    * @param string
    * @param string
    **/
    async getResource(Type, label, dataRange)
    {
        await this.sendFeedbackToChannel(`Retrieving ${label}.`);
        //Try to retrieve the data from the spreadsheet
        let response = {};
        try {
            const request = { spreadsheetId: this.spreadsheetId, range: dataRange };
            response = (await this.sheets.spreadsheets.values.get(request));
        } catch (err) {
            throw `Could not retrieve ${label}. Setup aborted.`;
        }

        //if data is available add it to eventData
        const rows = response.data.values;
        if (rows !== undefined && rows.length) {
            //@todo use Managers for other resources (Enemies, Narratives)
            if (label === 'sprinters') {
                this.SprintManager.addSprinter(rows);
                return;
            }
            if (label === 'sprints') {
                this.SprintManager.fillSprints(rows);
                return;
            }

            this.eventData[label] = rows.map((row) =>
            {
                return new Type(row);
            });
            //await this.sendFeedbackToChannel(`Retrieved ${label}.`);
        }
        return;
    }

    /**
    * Update spreadsheet
    *
    * @param string
    * @param string
    * @param Object
    **/
    async updateResource(label, dataRange, data)
    {
        //this.sendFeedbackToChannel(`Updating ${label}.`);

        //Try to retrieve the data from the spreadsheet
        let response = {};
        try {
            const request = { spreadsheetId: this.spreadsheetId, range: dataRange, valueInputOption: 'RAW', resource: { values: data } };
            response = (await this.sheets.spreadsheets.values.update(request));
        } catch (err) {
            throw `Could not update ${label}.`;
        }
        return;
    }

    /*
    * Clear range
    *
    * @param string
    * @param string
    * @param Object
    **/
    async clearResource(label, dataRange)
    {
        //this.sendFeedbackToChannel(`Clearing ${label}.`);

        //Try to retrieve the data from the spreadsheet
        let response = {};
        try {
            const request = { spreadsheetId: this.spreadsheetId, range: dataRange };
            response = (await this.sheets.spreadsheets.values.clear(request));
        } catch (err) {
            throw `Could not clear ${label}.`;
        }
        return;
    }

    async rejuvenate(message, args)
    {
        this.isRunning();

        if (!args.length) throw `No wordcount was supplied to rejuvenate`;
        const rejuv = parseInt(args[0]);
        const enemy = this.getCurrentEnemy();

        if (enemy.health + rejuv > enemy.wordcount) throw `Health goes over enemy wordcount with ${enemy.wordcount - enemy.health - rejuv}. Please decrease giving wordcount`;

        enemy.rejuvenate(rejuv);
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
        this.eventData.enemies.forEach(async ({ name, health, wordcount, healthbar, thumbnail }, key, enemies) =>
        {
            if ((key > 0 && !enemies[key - 1].defeated) || health === wordcount) {
                thumbnail = null;
                name = name.replace(/./gi, '?');
                health = `${health}`.replace(/[0-9]/gi, '?');
                wordcount = `${wordcount}`.replace(/[0-9]/gi, '?');
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
            sprinters.forEach(async ({ name, icon, thumbnail, wordcount, sprintWc }) =>
            {
                const wcDisplay = sprintWc ? `+${sprintWc} (${wordcount})` : `${wordcount}`;
                const embed = new this.Discord.MessageEmbed().setAuthor(`${name} ${icon} — ${wcDisplay}`, thumbnail);
                await this.sprintChannel.send(embed);
            });
        }
    }

    /* Show sprinters stats */
    async stats()
    {
        this.isRunning();

        const sprinters = this.SprintManager.getSprinters().sort((a, b) => b.wordcount - a.wordcount);

        if (!sprinters.length) return this.sendFeedbackToChannel('No sprinters have sprinted yet', true);

        const totalWritten = this.SprintManager.totalWc;
        const embeds = sprinters.map(({ name, icon, thumbnail, wordcount, numSprints, highestWc }) =>
        {
            return new this.Discord.MessageEmbed().setAuthor(`${name} ${icon} — ${wordcount}`, thumbnail)
                .setDescription(`**Sprint count:** ${numSprints} \u200B \u200B **Highest sprint wc:** ${highestWc}`);
        });
        await this.sprintChannel.send('**Stats:**');
        embeds.forEach(async (embed) => { await this.sprintChannel.send(embed) });
        this.sprintChannel.send(`**Total written: ${totalWritten}**`);
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

        this.sendInteraction(message, 'narrate', 'Narrator', ANON_ICON);
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
        this.sendInteraction(message, 'banter', name, thumbnail);
    }

    /**
     * Remove channel mentions and command
     * 
     * @param {any} message
     */
    stripMessageForInteraction(message, command)
    {
        let { content, mentions } = message;

        const images = Array.from(content.matchAll(/(http(s?):)([\/|.|\w|\s|-])*\.(?:png|jpg|jpeg|gif|svg)/g));

        //strip command and channel mentions
        content = content
            .replace(/<#[0-9]+>/g, '')
            .replace(/(http(s?):)([\/|.|\w|\s|-])*\.(?:png|jpg|jpeg|gif|svg)/g, '')
            .replace(`${process.env.PREFIX}${command} `, '');

        return { content, channels: mentions.channels, images };
    }


    /**
     * Send interaction as an embed to the sprint channel
     * 
     * @param string content
     * @param string name
     * @param string thumbnail
     */
    sendInteraction(message, type, name, thumbnail)
    {
        const { content, channels, images } = this.stripMessageForInteraction(message, type);

        const embed = new this.Discord.MessageEmbed()
            .setDescription(content)
            .setTitle(name)
            .setThumbnail(thumbnail);
        //If the images had messages, append the first one to the body of the embed
        if (images.length) {
            embed.setImage(images.shift()[0]);
        }
        //send to channels mentioned in original message
        if (channels && channels.size) {
            channels.forEach(channel => channel.send(embed));
        } else {
            this.sprintChannel.send(embed);
        }
        //if the message has multiple images, iterate and send
        images.forEach(([imageUrl]) => this.sprintChannel.send(new this.Discord.MessageEmbed().setImage(imageUrl)));
    }

    /**
     * Send enemy interaction on Sprinter actions
     * 
     * @param {any} content
     */
    enemyInteraction(content)
    {
        const { name, thumbnail } = this.getCurrentEnemy();

        const embed = new this.Discord.MessageEmbed()
            .setDescription(content)
            .setTitle(name)
            .setThumbnail(thumbnail);

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


    /**
     * Working on countdown
     * @param {any} message
     * @param {any} args
     */
    async countdown(message, args)
    {
        if(!args.length) throw `no countdown seconds given.`

        const [count, ...content] = args;
        const channel = message.mentions.channels.size ? message.mentions.channels.first(1)[0] : message.channel;

        this.count = count;
        this.countDownContent = content.join(' ').replace(/<#[0-9]+>/g, '');
        await channel.send(this.countDownContent).then(function (msg) { this.countDownMessage = msg; }.bind(this));
        this.updateCountDown();
        this.countDownTick();
    }

    updateCountDown()
    {
        var time = new Date(0, 0, 0, 0, 0, this.count).toTimeString().split(' ')[0];
        this.countDownMessage.edit(`${this.countDownContent}\n\n${time}`);
        this.countDownTick();
    }

    countDownTick()
    {
        if (this.count === 0) return;
        const time = this.count / 60 < 0 ? 1000 : 60000;
        const timeout = this.Client.setTimeout(this.updateCountDown.bind(this), time);
        this.count -= time/1000;
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