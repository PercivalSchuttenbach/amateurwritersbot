const MAIN_FILE = '1QmzQkkQdvhDRidLOYwc_yxSif4a0aMI4UQFDD51T3yM';
const DATA_RANGE = 'Users!A2:C';
const EMAIL_REGEXP = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

class Join
{
    constructor({ResourceManager})
    {
        this.ResourceManager = ResourceManager;

        if (!this.ResourceManager.checkIfSpreadSheetExists(MAIN_FILE)) throw 'Spreadsheet does not exist';
    }

    /**
     * Get second parameter from string and test for email address
     * 
     * @param {Message} message
     */
    getAndValidateEmailAddress({content})
    {
        let emailAddress = content.slice(process.env.PREFIX.length).trim().split(/ +/g)[1];

        if (!emailAddress || !EMAIL_REGEXP.test(emailAddress)) {
            throw `Email supplied is not a valid email address`;
        }

        return emailAddress
    }

    /**
     * Check if user already has a spreadsheet
     * 
     * @param {int} userId
     */
    checkIfUserExists(userId)
    {

    }

    /**
     * Create and link spreadsheet for user
     * 
     * @param {string} message
     * @param {boolean} silent
     */
    async join(message, silent=false)
    {
        try {
            let username = message.author.username;
            let userId = message.author.id;
            let emailAddress = this.getAndValidateEmailAddress(message);

            this.checkIfUserExists(userId);

            //copy file for user
            let response = await this.ResourceManager.copyFile(MAIN_FILE, username);
            let spreadsheetId = response.data.id;
            //add permissions for user
            await this.ResourceManager.insertPermission(spreadsheetId, emailAddress, 'user', 'writer');
            //append new member with spreadsheet to master list
            await this.ResourceManager.append(MAIN_FILE, DATA_RANGE, [
                [userId, username, spreadsheetId]
            ]);
        } catch (err) {
            console.log(`Create spreadsheet for user failed: ${err}`);
        }
    }
}

module.exports = {
    name: 'join',
    description: 'join',
    validate: function ({ author, channel })
    {
        return !author.bot && channel.type === 'dm';
    },
    init: function (resources)
    {
        return new Join(resources);
    }
};