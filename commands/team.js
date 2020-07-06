//@todo figure in wordcount submission based on ~team Percy 1000
//Sheet names are loaded using Set
//Build resource manager so Event and Teams use the same foundation?

const GoogleApi = require('../app/googleapi');
const { google } = require('googleapis');

class Team
{

	/**
	* @param resources
	*/	
	constructor({Discord})
	{
        
    }

    async team()
    {
        this.set().catch(e => console.log(e));
    }

    /**
   * RESOURCE MANAGEMENT
   */

    /**
    * Setup event using google spreadsheet
    *
    * @param array
    **/
    async set()
    {
        /*if (this.running || this.settingUp) {
            throw `An event is already running or being setup.`;
        }*/

        //this.settingUp = true;
        this.spreadsheetId = "1QmzQkkQdvhDRidLOYwc_yxSif4a0aMI4UQFDD51T3yM";

        await this.authenticateWithGoogle();
        if (this.spreadsheetId) {
           // await this.sendFeedbackToChannel(`Retrieving Event spreadsheet...`, true);

            if (!(await this.checkIfSpreadSheetExists(this.spreadsheetId))) {
                //this.clearAllData();
                throw 'SpreadsheetId supplied does not exist. "Try again with "~event set [google spreadsheet id]"';
            }
            //await this.setUp();
            //if (!this.dungeonRunning) this.Controller.save(message);
            return;
        }
        throw 'No spreadsheetId supplied. Try again with "~event set [google spreadsheet id]"';
    }

    /**
    * Attempt to autenticate with google
    */
    async authenticateWithGoogle()
    {
        if (this.sheets) return;
        //this.sendFeedbackToChannel('Authenticating with Google Spreadsheets...', true);
        console.log('Authenticating with Google Spreadsheets...');

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
   * Try to get the spreadsheet through the google api to check if it exists 
   *
   * @param string
   **/
    async checkIfSpreadSheetExists()
    {
        try {
            const request = { spreadsheetId: this.spreadsheetId, includeGridData: false };
            const { properties, sheets } = (await this.sheets.spreadsheets.get(request)).data;

            this.teams = sheets.map(sheet => sheet.properties.title);

            //this.sendFeedbackToChannel(`Found ${properties.title}. Will set up the event now...`);
            console.log(`Loaded teams ${this.teams.join(' & ')}.`);
        } catch (err) {
            return false;
        }
        return true;
    }

	/**
	* @param Discord.Message.content
	* @return Object
	*/
	getArgs(content)
	{
		let args = content.slice(process.env.PREFIX.length).trim().split(/ +/g);
		let command = args.shift().toLowerCase();

		return {command, args};
	}

	/**
	* @param Message
	*/
	help({channel, author})
	{
		channel.send(author.toString() + " I am sending you a DM");
	    author.send('**~choose** *option-1 option-2 option-3*: will choose one of the listed options for you.\n**~hangman**: start a classic party game others can join.\n**~tictactoe @username**: invites the mentioned player for a game of tic tac toe\n**~ouulthululu**: summons the Ouul\n**~motivated**: The Meme');
	}
}

module.exports = {
  name: 'Team',
  description: 'team',
  validate: function({author})
  {
  	return !author.bot;
  },
  init(resources){
	  return new Team(resources);
  }
};