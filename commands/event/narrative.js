class Narrative {

	constructor(row)
	{
		this.title = row[0];
		this.text = row[1];
		this.wordcount = parseInt(row[2]);
		this.image = row[3];
		this.shown = parseInt(row[4]);
		this.icon = row[5];
	}

	/**
	* Resets narrative to unshown
	*/
	reset()
	{
		this.shown = 0;

		return this;
	}

	setShown()
	{
		this.shown = 1;
	}

	toArray()
	{
		return [
			this.title,
			this.text,
			this.wordcount,
			this.image,
			this.shown,
			this.icon
		];
	}

}

module.exports = Narrative;