const hearts = {
	full:"❤️",
	broken:"💔",
	empty:"🖤"
};

const healthbarLength = 10;

class Enemy {

	constructor(row)
	{
		//0 name; 1 wordcount; 2 damage; 3 description; 4 image
		this.name = row[0];
		this.wordcount = parseInt(row[1]);
		this.health = parseInt(row[2]);
		this.description = row[3];
		this.image = row[4];
		this.thumbnail = row[5]
		this.defeatedText = row[6];
		this.healthbar = '';
		this.defeated = this.health === 0;
		this.setHealthbar();
	}

	/**
	* Resets enemy to full health and undefeated
	*/
	reset()
	{
		this.health = this.wordcount;
		this.defeated = 0;
		this.setHealthbar();

		return this;
	}

	/**
	* @param int
	*/
	takeDamage(wordcount)
	{
		this.health -= wordcount;

		if(this.health <= 0){
			this.health = 0;
			this.defeated = true;
		}

		this.setHealthbar();
	}

	/**
	* set healthbar
	*/
	setHealthbar()
	{
		const healthLeft = this.getHealthLeft();
		const numHearts = Math.floor(healthLeft);
		const brokenHeart = Math.ceil(healthLeft - numHearts);

		this.healthbar = [
			hearts.full.repeat(numHearts),
			hearts.broken.repeat(brokenHeart),
			hearts.empty.repeat(healthbarLength-Math.ceil(healthLeft))
		].join('');
	}

	/**
	* Get percentage of health left
	*/
	getHealthLeft(){
		return (this.health / this.wordcount) * healthbarLength;
	}

	/**
	* get battle text on the % of damage done
	*/
	getBattleText()
	{
		const healthLeft = this.getHealthLeft();

		let text = "Is nearly defeated! Almost there!";
		if(healthLeft >= 1){
			text = "Has had enough and is trying to get away!";
		}
		if (healthLeft >= 5) {
			text = "Is starting to feel it. But is still coming!";
		}
		if (healthLeft >= 9) {
			text = "Acts like they did not feel anything...";
		}
		return text;
	}

	/**
	* Get description or defeated text if defeated
	*/
	getDescription(isBattle){
		return this.defeated ? this.defeatedText : (isBattle ? this.getBattleText() : this.description);
	}

	/**
	* Prepare data for sheets
	**/
	toArray()
	{
		return [
			this.name,
			this.wordcount,
			this.health,
			this.description,
			this.image,
			this.thumbnail,
			this.defeatedText
		];
	}

}
module.exports = Enemy;