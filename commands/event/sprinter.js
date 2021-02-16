const ICONS = ['🧙', '🧚', '💂', '🧛', '🧞', '💃', '🕺', '🧘', '👤0', '🧑‍🦼', '🧜', '🤵', '🕵', '👮', '🧑‍🚀'];
const TYPES = { "m": 2, "wc": 1 };
const MULTIPLIER = 15;

class Sprinter {

	constructor([ id=null, name=null, wc=0, icon=null, type=1, gold=0 ])
	{
		this.id = id;
		this.name = name;
		this.wordcount = parseInt(wc);
		this.icon = icon ? icon : this.getRandomIcon();
		/* 1 is use wordcount. 2 is use minutes*/
		this.type = type ? parseInt(type) : 1;
		this.gold = parseInt(gold);
		this.sprintWc = 0;
		this.startWc = 0;
		this.joined = false;
		this.thumbnail = null;
		this.member = null;
		this.sprints = [];
		this.user = null;
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
	 * @param int gold
	 */
	addGold(gold)
	{
		this.gold += gold;
    }

	/**
	 * @param {any} wc
	 */
	setSprintStartWc(wc)
	{
		this.startWc = wc === 'same' || wc === '_=' ? this.startWc : parseInt(wc);
		this.joined = true;
    }

	/**
	* @param string|int
	**/
	setSprintWc(wordcount, newFlag)
	{
		this.startWc = (newFlag !== undefined || !this.joined) ? 0 : this.startWc;
		let wc = parseInt(wordcount) - this.startWc;
		this.sprintWc = this.type === 1 ? wc : (wc * MULTIPLIER);
	}

	/* Get num sprints joined */
	get numSprints()
	{
		return this.sprints.length;
	}

	/* Get highest sprint wc */
	get highestWc()
	{
		return Math.max(...this.sprints.map(({wc})=>wc));
    }

	/**
	* Update wordcount with sprintWc
	*/
	commit()
	{
		this.wordcount += this.sprintWc;
		this.startWc += this.sprintWc;
		this.sprintWc = 0;
		this.joined = false;
	}

	/**
	* Prepare data for spreadsheet
	*/
	toArray()
	{
		return [this.id, this.name, this.wordcount, this.icon, this.type, this.gold];
	}
}

module.exports = Sprinter;