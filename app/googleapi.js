const fs = require('fs');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './token.json';

class GoogleApi {

	constructor()
	{

	}

	static async getAuth(callback){
		// Load client secrets from a local file.
		fs.readFile('./credentials.json', (err, content) => {
		  if (err) throw `Error loading client secret file: ${err}`;
		  // Authorize a client with credentials, then call the Google Sheets API.
		  return this.authorize(JSON.parse(content), callback);
		});
	}

	/**
	 * Create an OAuth2 client with the given credentials, and then execute the
	 * given callback function.
	 * @param {Object} credentials The authorization client credentials.
	 * @param {function} callback The callback to call with the authorized client.
	 */
	static async authorize(credentials, callback) {
	  const {client_secret, client_id, redirect_uris} = credentials.installed;
	  const oAuth2Client = new google.auth.OAuth2(
	      client_id, client_secret, redirect_uris[0]);

	  // Check if we have previously stored a token.
	  fs.readFile(TOKEN_PATH, (err, token) => {
	    if (err) return this.getNewToken(oAuth2Client, callback);
	    oAuth2Client.setCredentials(JSON.parse(token));
	    callback(oAuth2Client);
	  });
	}

	/**
	 * Get and store new token after prompting for user authorization, and then
	 * execute the given callback with the authorized OAuth2 client.
	 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
	 * @param {getEventsCallback} callback The callback for the authorized client.
	 */
	static async getNewToken(oAuth2Client, callback) {
		if(!process.env.GOOGLE_CODE)
		{
			console.log('Authorize this app by visiting this url:', authUrl);
			throw `Ask Percy to authenticate with Google.`;
		}

		const authUrl = oAuth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: SCOPES,
		});
		this.getToken(oAuth2Client, callback);
	}

	static async getToken(oAuth2Client, callback){
	    oAuth2Client.getToken(process.env.GOOGLE_CODE, (err, token) => {
	      if (err) throw `Error while trying to retrieve access token: ${err}`;
	      oAuth2Client.setCredentials(token);
	      // Store the token to disk for later program executions
	      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
	        if (err) return console.error(err);
	        console.log('Token stored to', TOKEN_PATH);
	      });
	      callback(oAuth2Client);
	    });
	 }
}

module.exports = GoogleApi;