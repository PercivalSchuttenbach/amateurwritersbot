const GoogleApi = require('../app/googleapi');
const {google} = require('googleapis');
const Enemy = require('./event/enemy');
const Sprinter = require('./event/sprinter');
const Narrative = require('./event/narrative');

const DATA_RANGES = {
  sprinters: 'Sprinters!A2:E',
  enemies: 'Enemies!A2:G',
  narratives: 'Narrative!A2:E'
};

const SPRINT_BOTS = [
  {
    start_text: "JOIN THE SPRINT",
    collect_start: "TIME'S UP",
    wc_text: /^_wc\s+\d+/,
    collect_stop: "CONGRATS EVERYONE",
    writing: "THE SPRINT BEGINS"
  },
  {
    start_text: "A new sprint has been scheduled",
    collect_start: "Time is up",
    wc_text: /^!sprint\s+wc\s+\d+/,
    collect_stop: /Congratulations to everyone|No-one submitted their wordcounts/,
    writing: "Sprint has started"
  }
];

const DUNGEONS = {
  "test": "1ARcgeXxr_ARNUShlwvP0_vQdDwhkpkS-N7NxnYUfFwQ"
};

const ICONS = ['🧙','🧚','💂','🧛','🧞','💃','🕺','🧘','👤0','🧑‍🦼','🧜','🤵','🕵','👮','🧑‍🚀'];
const ANON_ICON = "https://media.discordapp.net/attachments/652184396819857448/706831256700190780/anon.jpg";
const EMBED_FOOTER = {label:'By: Book or Bust',value:'https://media.discordapp.net/attachments/673284825167429642/673302072585748491/NewDashBanner.png?width=573&height=475'};

class Event {

  constructor({Client, Discord, message, Controller})
  {
    /** @var array **/
    this.eventData = {
      enemies: [],
      sprinters: [],
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
      wc:[],
      stop: [],
      writing: []
    };
    /** @var array **/
    this.subCommands = {'set':true,'start':true,'stop':true, 'dungeon':true, 'type':true};
  }

  /**
  * @param string
  */
  handleError(err)
  {
    this.sendFeedbackToChannel(err, true);
    this.removeAllListeners();
    this.clearAllData();
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
      sprinters: [],
      narratives: []
    }
    this.spreadsheetId = null;
    this.botMessage = null;
    this.title = null;
    this.dungeonRunning = false;
  }

  /**
  * remove all listeners
  **/
  removeAllListeners()
  {
    for(var key in this.listeners)
    {
      this.removeListener(key);
    }
  }

  checkIfActive()
  {
    return this.running || this.settingUp;
  }

  /**
  * Send a new message or update an existing message to update user of status
  * 
  * @param string
  **/
  async sendFeedbackToChannel(text, direct=false)
  {
    if(this.botMessage && !direct)
    {
      await this.botMessage.edit(text)
        .then((message=>this.botMessage = message).bind(this)).catch(err=>console.log(err));
      return;  
    }
    if(this.channel)
    {
      await this.channel.send(text)
        .then((message=>this.botMessage = message).bind(this)).catch(err=>console.log(err));
      return;
    }
    //@todo figure out what to do when no channel has been set
  }

  /**
  * @param Discord.Message.content
  * @return Object
  */
  getArgs({content})
  {
    let command = '';
    //split string on spaces
    let args = content.slice(process.env.PREFIX.length).trim().split(/ +/g);
    if(args.length > 1)
    {
      //remove the command that initiated this model
      args.shift();
      command = args.shift().trim().toLowerCase(); 
    }

    return {command, args};
  }

  /**
  * Command function called from controller
  *
  * @param Discord.Message
  **/
  async event(message)
  {
    this.channel = message.channel;

    if(!this.sheets){
      await this.authenticateWithGoogle().catch(this.handleError.bind(this));
    }
    //Get command and arguments and call subcommand
    let {command, args} = this.getArgs(message);
    //@todo make sure not all methods can be called from chat
    if(!this.subCommands[command])
    {
      this.sendFeedbackToChannel('No valid subcommand given. Use "~event help"', true);
      return;
    }
    //execute subcommand method. On error catch and send to channel
    //@todo remove all data on exception
    this[command](args, message).catch(this.handleError.bind(this));
  }

  /**
  * Start the event that has been set
  */
  async start()
  {
    if(this.running){
      this.sendFeedbackToChannel(`There is already an event running.`, true);
      return;
    }

    if(!this.areThereEnemiesLeft()){
      this.showEnd();
      return;
    }
    //this.sendFeedbackToChannel(`Adding listeners for sprint bots for sprint start`);

    //Bind listeners for event
    SPRINT_BOTS.forEach(({start_text, collect_start, collect_stop, writing})=>{
      this.listeners.start.push(this.addListener(start_text, true, this.sprintInitiated));
      this.listeners.col.push(this.addListener(collect_start, true, this.listenForWc));
      this.listeners.stop.push(this.addListener(collect_stop, true, this.sumbitSprintWc));
      this.listeners.writing.push(this.addListener(writing, true, this.sprintBegins));
    });
    //flag the event as started and show begin
    this.running = true;
    this.showBegin();
  }

  /**
  * Stop and clear event
  **/
  async stop()
  {
    this.removeAllListeners();
    this.clearAllData();
    this.sendFeedbackToChannel(`Event has been stopped.`, true);
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
    const {sprinters, narratives} = this.eventData;
    let totalWritten = sprinters.reduce((a,b)=>a+b.wordcount, 0);
    let newNarrative = narratives.find(({wordcount, shown})=>!shown && totalWritten >= wordcount);
    if(newNarrative){
      this.showNarrative(newNarrative);
    }
  }

  /**
  * Bind listeners to the Controller for all posible bot wc commands
  **/
  listenForWc()
  {
    //this.sendFeedbackToChannel(`Listening for sprint bots for wc`);

    SPRINT_BOTS.forEach(({wc_text})=>{
      this.listeners.wc.push(this.addListener(wc_text, false, this.processSprintWc));
    });
  }

  /**
  * @param RegEx|string
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
    while(this.listeners[type].length > 0)
    {
      this.Controller.stopListeningTo(this.listeners[type].shift());
    }
  }

  /**
  * @param Message
  */
  processSprintWc({content, author})
  {
    //this.sendFeedbackToChannel("Listened to: " + content, true);
    const wc = content.match(/(\d+)/);
    if(wc){
      let sprinter = this.getSprinter(author);
      sprinter.setSprintWc(wc[0]);
    }
  }


  /**
  * Sprint bot collected all wordcount from sprinters
  */
  async sumbitSprintWc()
  {
    this.removeListener('wc');
    await this.commit();
    if(!this.areThereEnemiesLeft())
    {
      this.end(); 
    }
    this.showSprinters();
  }

  /**
  * Check if there are still enemies left
  *
  * @return bool
  */
  areThereEnemiesLeft()
  {
    return this.eventData.enemies.find(({defeated})=>!defeated);
  }

  /**
  * Event has ended on its own. Clear listeners
  */
  end()
  {
    this.removeAllListeners();
    this.showEnd();
  }

  /**
  * Show end narrative of the event
  */
  showEnd()
  {
      const narratives = this.eventData.narratives;
      this.showNarrative(narratives[narratives.length-1]);
  }

  /**
  * Show begin narrative of the event
  **/
  showBegin()
  {
    this.showNarrative(this.eventData.narratives[0]);
  }


  /**
  * Wordcount collected by sprint bot. Commit all data.
  */
  async commit()
  {
    let totalWcCurrentSprint = 0;
    //Map sprinter data to array for spreadsheet
    const sprintersData = this.eventData.sprinters.map((sprinter)=>{
      //collect total wc sprint and commit the wc for sprinters
      totalWcCurrentSprint += sprinter.sprintWc;
      sprinter.commit();
      return sprinter.toArray();
    });

    this.updateEnemy(totalWcCurrentSprint);

    //Map enemies data to array for spreadsheet
    const enemiesData = this.eventData.enemies.map(enemy=>enemy.toArray());
    //Map narratives data to array for spreadsheet
    const narrativesData = this.eventData.narratives.map(narrative=>narrative.toArray());

    //update sheets on spreadsheet
    await this.updateResource('sprinters', DATA_RANGES.sprinters, sprintersData);
    await this.updateResource('enemies', DATA_RANGES.enemies, enemiesData);
    await this.updateResource('narratives', DATA_RANGES.narratives, narrativesData);
  }

  /**
  * Update current enemy in battle
  *
  * @param int
  */
  updateEnemy(wordcount=0)
  {
    let currentEnemy = this.eventData.enemies.find(({defeated})=>!defeated);
    if(currentEnemy){
      currentEnemy.takeDamage(wordcount);
      this.showEnemy(currentEnemy, true);
      return;
    }
    throw `Event had already ended`;
  }

  /**
  * Show enemy at start of sprint
  */
  sprintBegins()
  {
    let currentEnemy = this.eventData.enemies.find(({defeated})=>!defeated);
    if(currentEnemy){
     this.showEnemy(currentEnemy, false);
    }
  }

  /**
  * Retrieve random avatar icon for sprinter
  */
  getRandomIcon()
  {
    const intRandom = Math.floor(Math.random() * ICONS.length);
    return ICONS[intRandom];
  }

  /**
  * Set user type
  *
  * @param array
  * @param Message
  */
  async type(args, message)
  {
    if(!args.length || !["m","wc"].includes(args[0])){
      throw `No type supplied "~event type *m* **or** *wc*" m for minutes or wc for wordcount`;
    }
    let sprinter = this.getSprinter(message.author);
    sprinter.setType(args[0]);
    this.sendFeedbackToChannel(`Your sprint type has been set to ${args[0] == 'm' ? 'minutes' : 'wordcount'}`, true);
  }

  /**
  * @param author
  */
  getSprinter(author)
  {
    let sprinter = this.eventData.sprinters.find(({id})=>id==author.id);
    if(!sprinter)
    {
      //Sprinter is not in eventData yet. Add it
      sprinter = new Sprinter([
        author.id,
        author.username,
        0,
        this.getRandomIcon()
      ])
      this.eventData.sprinters.push(sprinter);
    }
    return sprinter;
  }

  /**
  * RESOURCE MANAGEMENT
  */

  /**
  * Attempt to autenticate with google
  */
  async authenticateWithGoogle()
  {
    this.sendFeedbackToChannel('Authenticating with Google Spreadsheets...', true);

    const auth = (await new Promise(GoogleApi.getAuth.bind(GoogleApi)).then(this.setAuth.bind(this)).catch((err)=>{console.log(err);throw `Could not authenticate with Google Spreadsheets.`}));
  }

  /**
  * Set sheets property and add auth to Google Sheets API
  *
  * @param oAuth2Client
  */
  setAuth(auth)
  {
    this.sheets = google.sheets({version: 'v4', auth});
  }

  /**
  * Run premade Event from DUNGEONS list
  * @param array
  */
  async dungeon(args)
  {
    if(!args.length){
      throw `No dungeon was supplied. See ~event help.`;
    }
    let dungeon = DUNGEONS[args[0]];
    if(!dungeon){
      throw `No dungeon was supplied or does not exist. See ~event help.`;
    }
    this.dungeonRunning = true;
    
    //set expects an array of arguments
    await this.set([dungeon]).catch(this.handleError.bind(this));
    if(!this.areThereEnemiesLeft() && this.dungeonRunning){
      await this.resetDungeon();
    }
    this.sendFeedbackToChannel(`Dungeon has been set up! Start with "~event start" and use one of the Sprint bots =)`);
  }

  /**
  * Setup event using google spreadsheet
  *
  * @param array
  **/
  async set(args)
  {
    if(this.checkIfActive())
    {
      throw `An event is already running or being setup.`;
    }
    if(args.length){
      this.sendFeedbackToChannel(`Retrieving Event spreadsheet...`, true);

      this.settingUp = true;
      this.spreadsheetId = args[0];

      if(!(await this.checkIfSpreadSheetExists(this.spreadsheetId))){
        throw 'SpreadsheetId supplied does not exist. "Try again with "~event set [google spreadsheet id]"';
      }
      await this.setUp().catch(this.handleError.bind(this));
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
      const request = {spreadsheetId: this.spreadsheetId, includeGridData: false};
      const {properties} = (await this.sheets.spreadsheets.get(request)).data;

      this.title = properties.title;
      this.sendFeedbackToChannel(`Found ${properties.title}. Will set up the event now...`);
    }catch(err) {
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

    if(!this.areThereEnemiesLeft() && !this.dungeonRunning) throw `This event already took place. Reset or choose another.`;
    
    await this.getResource(Narrative, 'narratives', DATA_RANGES.narratives);
    await this.getResource(Sprinter, 'sprinters', DATA_RANGES.sprinters);

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
    //Map enemies data to array for spreadsheet
    const enemiesData = this.eventData.enemies.map(enemy=>enemy.reset().toArray());
    //Map narratives data to array for spreadsheet
    const narrativesData = this.eventData.narratives.map(narrative=>narrative.reset().toArray());

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
   //await this.sendFeedbackToChannel(`Retrieving ${label}.`);

    //Try to retrieve the data from the spreadsheet
    let response = {};
    try{
      const request = {spreadsheetId: this.spreadsheetId, range: dataRange};
      response = (await this.sheets.spreadsheets.values.get(request));
    }catch(err){
      throw `Could not retrieve ${label}. Setup aborted.`;
    }
    
    //if data is available add it to eventData
    const rows = response.data.values;
    if(rows !== undefined && rows.length){
      this.eventData[label] = rows.map((row)=> new Type(row));
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
    try{
      const request = {spreadsheetId: this.spreadsheetId, range: dataRange, valueInputOption: 'RAW', resource: {values: data}};
      response = (await this.sheets.spreadsheets.values.update(request));
    }catch(err){
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
    try{
      const request = {spreadsheetId: this.spreadsheetId, range: dataRange};
      response = (await this.sheets.spreadsheets.values.clear(request));
    }catch(err){
      throw `Could not clear ${label}.`;
    }
    return;
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

    this.sendFeedbackToChannel(embed, true);
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
    .setThumbnail(ANON_ICON)
    .setFooter(EMBED_FOOTER.label, EMBED_FOOTER.value);

    narrative.setShown();

    this.sendFeedbackToChannel(embed, true);
  }

  /**
  * Show list of current sprinters
  */
  showSprinters()
  {
    const sprinters = this.eventData.sprinters;
    if(sprinters.length){
      const embed = new this.Discord.MessageEmbed().setTitle("Our heroes:");

      sprinters.forEach(({name, wordcount, icon})=>embed.addField(`${name} ${icon}`, `Written: ${wordcount}`, sprinters.length > 1));
      this.sendFeedbackToChannel(embed, true);
    }
  }

}

module.exports = {
  name: 'Event',
  description: 'Running an event that uses the Sprint Bots',
  validate: function(message)
  {
  	return true;
  },
  init: function(resources)
  {
  	return new Event(resources);
  }
};