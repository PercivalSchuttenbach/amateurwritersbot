const User = require('./user');

const SPREADSHEET_ID = '1QmzQkkQdvhDRidLOYwc_yxSif4a0aMI4UQFDD51T3yM';
const DATA_RANGE = 'Users!A2:F';

class UserManager
{
    constructor(ResourceManager)
    {
        this.ResourceManager = ResourceManager;
        this.users = [];

        if (!this.ResourceManager.checkIfSpreadSheetExists(SPREADSHEET_ID)) throw 'Spreadsheet does not exist';
    }

    async getUsers()
    {
        const data = (await this.ResourceManager.get(SPREADSHEET_ID, DATA_RANGE));
        if (data) {
            this.users = data.map(row => new User(row));
        }
    }

    getUserBySprinter({ id, name, wordcount, gold, numSprints })
    {
        let user = this.users.find(user => user.id === id);
        if (!user) user = this.addUser([id, name, wordcount, numSprints, 0, gold]);
        return user;
    }

    addUser(data)
    {
        const user = new User(data);
        this.users.push(user);
        this.ResourceManager.append(SPREADSHEET_ID, DATA_RANGE, [user.toArray()]);
        return user;
    }

    //write all users to sheet
    commit()
    {
        this.users.forEach(user =>
        {
            let sprinter = user.sprinter;
            user.gold = sprinter.gold;
            user.written += sprinter.sprintWc;
            user.sprints++;
        });

        const data = this.users.map(user => user.toArray());
        this.ResourceManager.update(SPREADSHEET_ID, DATA_RANGE, data);
    }
}

module.exports = UserManager;