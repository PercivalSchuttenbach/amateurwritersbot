const GoogleApi = require('../../app/googleapi');
const { google } = require('googleapis');

const Enemy = require('./enemy');
const Sprinter = require('./sprinter');
const Narrative = require('./narrative');

const DATA_RANGES = {
    sprinters: 'Sprinters!A2:E',
    enemies: 'Enemies!A2:G',
    narratives: 'Narrative!A2:F'
};

class ResourceManager
{
    constructor(sendFeedbackToChannel, removeAllListeners)
    {
        /**@function**/
        this.sendFeedbackToChannel = sendFeedbackToChannel;
         /**@function**/
        this.removeAllListeners = removeAllListeners;

        /** @var google.sheets **/
        this.sheets = null;
        /** @var string **/
        this.spreadsheetId = null;
        /** @var array **/
        this.eventData = {
            enemies: [],
            sprinters: [],
            narratives: []
        };
        /** @var bool **/
        this.settingUp = false;
        /** @var bool **/
        this.running = false;
        /** @var bool **/
        this.dungeonRunning = false;
        /** @var string **/
        this.title = null;
    }

   /**
   * @param string
   */
    async handleSetupError(err)
    {
        this.clearAllData();
        this.removeAllListeners();

        throw err;
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
        this.title = null;
        this.dungeonRunning = false;
    }

   /**
   * Setup event using google spreadsheet
   *
   * @param array
   **/
    async set(spreadsheetId)
    {
        await this.authenticateWithGoogle();
        await this.sendFeedbackToChannel(`Retrieving Event spreadsheet...`, true);

        this.settingUp = true;
        this.spreadsheetId = spreadsheetId;

        if (!(await this.checkIfSpreadSheetExists(this.spreadsheetId))) {
            this.clearAllData();
            throw 'SpreadsheetId supplied does not exist. "Try again with "~event set [google spreadsheet id]"';
        }
        await this.setUp().catch(this.handleSetupError.bind(this));
        return;
    }

    /**
     * Reload event data
     */
    async reload()
    {
        await this.setUp().catch(this.handleSetupError.bind(this));
    }

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

        if (!this.areThereEnemiesLeft() && !this.dungeonRunning) throw `This event already took place. Reset or choose another.`;

        await this.getResource(Narrative, 'narratives', DATA_RANGES.narratives);
        await this.getResource(Sprinter, 'sprinters', DATA_RANGES.sprinters);

        await this.sendFeedbackToChannel(`Event ${this.title} has been setUp! Start with "~event start" and use one of the Sprint bots =)`);
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
        try {
            const request = { spreadsheetId: this.spreadsheetId, range: dataRange };
            response = (await this.sheets.spreadsheets.values.get(request));
        } catch (err) {
            throw `Could not retrieve ${label}. Setup aborted.`;
        }

        //if data is available add it to eventData
        const rows = response.data.values;
        if (rows !== undefined && rows.length) {
            this.eventData[label] = rows.map((row) =>
            {
                return new Type(row);
            });
            //await this.sendFeedbackToChannel(`Retrieved ${label}.`);
        }
        return;
    }

    /**
     * @return array of event type
     */
    get get(types)
    {
        if (Array.isArray(type)) {
            return types.map(type => this.eventData[type]);
        }

        return this.eventData[types];
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
}

module.exports = ResourceManager;