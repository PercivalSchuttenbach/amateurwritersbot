const MAIN_FILE = '1HWxWvmuWrYWl3zzLcH3xxibogHTLl2BB5HFVovOnJIc';
const DATA_RANGE = 'Prompts!A1:A';

class Prompt
{
    constructor({ResourceManager, Discord})
    {
        this.ResourceManager = ResourceManager;
        this.Discord = Discord;
        this.prompts = null;

        if (!this.ResourceManager.checkIfSpreadSheetExists(MAIN_FILE)) throw 'Spreadsheet does not exist';
    }

    /**
	* @param Discord.Message.content
	* @return Object
	*/
    getArgs(content)
    {
        let args = content.slice(process.env.PREFIX.length).trim().split(/ +/g);
        let command = args.shift().toLowerCase();

        return { command, args };
    }

    async prompt({channel, content})
    {
        let { args } = this.getArgs(content);
        if (!this.prompts || args.length) {
            this.prompts = await this.ResourceManager.get(MAIN_FILE, DATA_RANGE);
        }

        let intRandom = Math.floor(Math.random() * this.prompts.length);
        let embed = new this.Discord.MessageEmbed();
        embed.setDescription(this.prompts[intRandom][0]);

        channel.send(embed);
    }
}

module.exports = {
    name: 'prompt',
    description: 'prompt',
    validate: function ({ author, channel })
    {
        return !author.bot;
    },
    init: function (resources)
    {
        return new Prompt(resources);
    }
};