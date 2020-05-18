const ICONS = ['🧙', '🧚', '💂', '🧛', '🧞', '💃', '🕺', '🧘', '👤0', '🧑‍🦼', '🧜', '🤵', '🕵', '👮', '🧑‍🚀'];
const TYPES = { "m": 2, "wc": 1 };
const MULTIPLIER = 15;

class Sprinter {

	constructor([ id=null, name=null, wc=0, icon=null, type=1 ])
	{
		this.id = id;
		this.name = name;
		this.wordcount = parseInt(wc);
		this.icon = icon ? icon : this.getRandomIcon();
		/* 1 is use wordcount. 2 is use minutes*/
		this.type = type ? parseInt(type) : 1;
		this.sprintWc = 0;
		this.startWc = 0;
		this.joined = false;
		this.thumbnail = null;
		this.member = null;
		this.sprints = [];
	}

	/**
    * Retrieve random avatar icon for sprinter
    */
	getRandomIcon()
	{
		const intRandom = Math.floor(Math.random() * ICONS.length);
		return ICONS[intRandom];
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
		console.log(`old this.startWc ${this.startWc}`);
		this.startWc = (newFlag !== undefined || !this.joined) ? 0 : this.startWc;
		console.log(`new this.startWc ${this.startWc}`);
		let wc = parseInt(wordcount) - this.startWc;
		console.log(`new wc ${wc}`);
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