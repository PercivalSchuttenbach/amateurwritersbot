class User
{

	constructor(index, data)
	{
		this.index = index;
		this.id = data[0];
		this.sheetName = data[1];
		this.totalWritten = data[2];
		this.xp = data[3];
		this.gold = data[4];
		this.changed = false;
		this.sprinter = null;
	}

	toArray()
	{
		return [
			this.id,
			this.sheetName,
			this.totalWritten,
			this.xp,
			this.gold,
		];
	}

}

module.exports = User;