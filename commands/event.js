const GoogleApi = require('../app/googleapi');
const {google} = require('googleapis');
/** @class Enemy **/
const Enemy = require('./event/enemy');

class Event {

  /**
  * @var sheets google.sheets
  * @var channel Message.channel
  */

  constructor({Client, Discord, message})
  {
    this.enemies = [];
    this.Discord = Discord;
    const test = new Promise(GoogleApi.getAuth.bind(GoogleApi)).then(this.setAuth.bind(this));
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
      command = args.shift().toLowerCase(); 
    }

    return {command, args};
  }

  /**
  * Set sheets property and add auth to Google Sheets API
  * @param oAuth2Client
  */
  setAuth(auth)
  {
    this.sheets = google.sheets({version: 'v4', auth});
  }

  /**
  * Command function called from controller
  * @param Discord.Message
  **/
  event(message)
  {
    this.channel = message.channel;

    if(this.sheets)
    {
      //Get command and arguments and call subcommand
      let {command, args} = this.getArgs(message);
      if(!this[command])
      {
        this.channel.send('No valid subcommand given. Use "~event set [google spreadsheet id]" to set up event');
        return;
      }
      this[command](args);
    }
    else
    {
      //keep recursing untill Auth has been set
      //@todo make sure in does not run indefinelty 
      setTimeout(function(){
        this.event(message)
      }.bind(this),1000);
    }
  }

  /**
  * Setup event using google spreadsheet
  * @param array
  **/
  async set(args)
  {
    if(args.length){
      this.channel.send(`Retrieving Event spreadsheet.`);

      this.spreadsheetId = args[0];
      const exists = (await this.checkIfSpreadSheetExists(this.spreadsheetId));
      if(!exists){
        this.channel.send('SpreadsheetId supplied does not exist. "Try again with "~event set [google spreadsheet id]"');
        return;
      }
      this.setUp();
      return;
    }
    this.channel.send('No spreadsheetId supplied. Try again with "~event set [google spreadsheet id]"');
  }

  /**
  * Initialize Event
  * @param string
  **/
  async setUp()
  {
    await this.getEnemies();
    this.enemies.forEach(enemy=>this.showEnemy(enemy));
    //@todo load enemies in object
    //@todo load sprinters in object
    //@todo load event info in object
  }

  /**
  * @param string
  **/
  async checkIfSpreadSheetExists()
  {
    try {
      const request = {spreadsheetId: this.spreadsheetId, includeGridData: false};
      const {properties} = (await this.sheets.spreadsheets.get(request)).data;
      this.channel.send(`Found ${properties.title}. Will set up the event now.`);
    }catch(err) {
      return false;
    }
    return true;
  }

  /**
  * set Enemies by using spreadsheet
  **/
  async getEnemies()
  {
    this.channel.send(`Retrieving enemies.`);

    let response = {};
    try{
      const request = {spreadsheetId: this.spreadsheetId, range: 'Enemies!A2:E'};
      response = (await this.sheets.spreadsheets.values.get(request));
    }catch(err){
      this.channel.send(`Could not retrieve enemies. Setup aborted.`);
      return;
    }
    
    const rows = response.data.values;
    if(rows.length){
      rows.forEach((row)=> {
          this.enemies.push(new Enemy(row));
      });
    }
    this.channel.send(`Retrieved enemies.`);
  }

  showEnemy(enemy)
  {
    const embed = new this.Discord.MessageEmbed()
    .setTitle(enemy.name)
    .setDescription(enemy.description)
    .setImage(enemy.image);

    this.channel.send(embed);
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