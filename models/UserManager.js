const User = require('./user');

const SPREADSHEET_ID = '1QmzQkkQdvhDRidLOYwc_yxSif4a0aMI4UQFDD51T3yM';
const DATA_RANGE = 'Users!A2:E';

class UserManager
{
    constructor(ResourceManager)
    {
        this.ResourceManager = ResourceManager;

        if (!this.ResourceManager.checkIfSpreadSheetExists(SPREADSHEET_ID)) throw 'Spreadsheet does not exist';
    }

    async getUsers()
    {
        const data = (await this.ResourceManager.get(SPREADSHEET_ID, DATA_RANGE));
        if (data) {
            this.users = data.map((row, index) => new User(index, row));
        }
    }

    getUser(id)
    {
        return this.users.find(user => user.id === id);
    }

    commit()
    {
        //write all users to sheet
    }
}

module.exports = UserManager;