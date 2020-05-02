const hearts = {
	full:"❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️",
	broken:"💔",
	empty:"🖤🖤🖤🖤🖤🖤🖤🖤🖤🖤"
};

const healthbarLength = 10;

class Enemy {

	/**
	* @var name
	* @var wordcount
	* @var description
	* @var image
	* @var health
	**/
	constructor(row)
	{
		//0 name; 1 wordcount; 2 damage; 3 description; 4 image
		this.name = row[0];
		this.wordcount = row[1];
		this.health = row[2];
		this.description = row[3];
		this.image = row[4];
		this.healthbar = '';
		this.setHealthbar();
	}

	/**
	* @param int
	*/
	takeDamage(wordcount)
	{
		this.health -= wordcount;
		this.setHealthbar();
	}

	/**
	* set healthbar
	*/
	setHealthbar()
	{
		const healthLeft = this.health / this.wordcount * healthbarLength;
		const numHearts = Math.floor(healthLeft);
		const brokenHeart = Math.ceil(healthLeft - numHearts);

		this.healthbar = [
			hearts.full.slice(0,numHearts),
			hearts.broken.slice(0,brokenHeart),
			hearts.empty.slice(0,healthbarLength-Math.ceil(healthLeft))
		].join('');
	}

}
module.exports = Enemy;