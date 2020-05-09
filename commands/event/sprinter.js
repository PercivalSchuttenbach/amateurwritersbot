const TYPES = {"m":2,"wc":1};
const MULTIPLIER = 15;

class Sprinter {

	constructor(data)
	{
		this.id = data[0]
		this.name = data[1];
		this.wordcount = parseInt(data[2]);
		this.icon = data[3];
		/* 1 is use wordcount. 2 is use minutes*/
		this.type = data[4] ? parseInt(data[4]) : 1;
		this.sprintWc = 0;
		this.startWc = 0;
		this.joined = false;
	}

	/**
	* @param string
	*/
	setType(type){
		this.type = TYPES[type];
	}

	/**
	 * @param {any} wc
	 */
	setSprintStartWc(wc)
	{
		this.startWc = wc === 'same' ? this.startWc : parseInt(wc);
		this.joined = true;
    }

	/**
	* @param string|int
	**/
	setSprintWc(wordcount, newFlag)
	{
		this.startWc = (newFlag !== undefined || !this.joined) ? 0 : this.startWc;

		let wc = parseInt(wordcount) - this.startWc;
		this.startWc += wc;
		this.sprintWc = this.type === 1 ? wc : (wc * MULTIPLIER);
	}

	/**
	* Update wordcount with sprintWc
	*/
	commit()
	{
		this.wordcount += this.sprintWc;
		this.sprintWc = 0;
		this.joined = false;
	}

	/**
	* Prepare data for spreadsheet
	*/
	toArray()
	{
		return [this.id, this.name, this.wordcount, this.icon, this.type];
	}
}

module.exports = Sprinter;