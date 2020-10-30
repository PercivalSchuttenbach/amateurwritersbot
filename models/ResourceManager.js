const GoogleApi = require('../app/googleapi');
const { google } = require('googleapis');

class ResourceManager
{
    constructor()
    {
        this.sheets = null;
        this.drive = null;
    }

    /**
    * Attempt to autenticate with google
    */
    async authenticateWithGoogle()
    {
        if (this.sheets) return;
        //this.sendFeedbackToChannel('Authenticating with Google Spreadsheets...', true);

        const auth = (await new Promise(GoogleApi.getAuth.bind(GoogleApi)).then(await this.setAuth.bind(this)).catch((err) => { console.log(err); throw `Could not authenticate with Google Spreadsheets.` }));
    }

    /**
    * Set sheets property and add auth to Google Sheets API
    *
    * @param oAuth2Client
    */
    async setAuth(auth)
    {
        console.log('setAuth');
        this.sheets = google.sheets({ version: 'v4', auth });
        this.drive = google.drive({ version: 'v3', auth });
    }

    /**
   * Try to get the spreadsheet through the google api to check if it exists 
   *
   * @param string
   **/
    async checkIfSpreadSheetExists(spreadsheetId)
    {
        if (!this.sheets) return false;

        try {
            const request = { spreadsheetId: spreadsheetId, includeGridData: false };
            const { properties } = (await this.sheets.spreadsheets.get(request)).data;

            //this.title = properties.title;
            //this.sendFeedbackToChannel(`Found ${properties.title}. Will set up the event now...`);
        } catch (err) {
            return false;
        }
        return true;
    }

    async get(spreadsheetId, dataRange)
    {
        let response = {};
        try {
            const request = { spreadsheetId: spreadsheetId, range: dataRange };
            response = (await this.sheets.spreadsheets.values.get(request));
        } catch (err) {
            throw `Could not retrieve ${dataRange}.`;
        }

        return response.data.values;
    }

    /**
     * Append data to spreadsheet
     * 
     * @param {string} spreadsheetId
     * @param {string} dataRange
     * @param {array} data
     */
    async append(spreadsheetId, dataRange, data)
    {
        let response = {};
        try {
            const request = { spreadsheetId, range: dataRange, valueInputOption: 'RAW', resource: { values: data } };
            response = (await this.sheets.spreadsheets.values.append(request));
        } catch (err) {
            throw `Could not update spreadsheet ${err}.`;
        }
        return;
    }

    /**
     * Insert a new permission.
     *
     * @param { String } fileId ID of the file to insert permission for.
     * @param { String } value User or group e - mail address, domain name or
        * {@code null} "default" type.
     * @param { String } type The value "user", "group", "domain" or "default".
     * @param { String } role The value "owner", "writer" or "reader".
     */
    async insertPermission(fileId, value, type, role)
    {
        let response = {};

        try {
            var body = {
                'emailAddress': value,
                'type': type,
                'role': role
            };
            response = await this.drive.permissions.create({
                'fileId': fileId,
                'resource': body
            });
        } catch (err) {
            throw `Could not inser permissions: ${err}`;
        }
    }

    /**
     * Copy a drive file
     * 
     * @param {string} fileId
     * @param {string} newName
     */
    async copyFile(fileId, newName)
    {
        let response = {};

        try {
            var body = {
                name: newName
            };
            response = await this.drive.files.copy({ fileId, resource: body });
        } catch (err) {
            throw `Could not copy file: ${err}`;
        }

        return response;
    }
}

module.exports = new ResourceManager();