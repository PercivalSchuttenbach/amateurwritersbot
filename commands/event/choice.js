class Choice {

	constructor(row)
	{
		this.title = row[0];
		this.text = row[1];
		this.conditions = row[2];
		this.options = row[3];
		this.actions = row[4];
		this.shown = parseInt(row[5]);
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
			this.conditions,
			this.options,
			this.actions,
			this.shown
		];
	}

}

module.exports = Choice;