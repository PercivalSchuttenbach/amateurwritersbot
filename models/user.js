class User
{

	constructor([ id=null, name=null, written=0, sprints=0, xp=0, gold=0])
	{
		this.id = id;
		this.name = name;
		this.written = written;
		this.sprints = sprints;
		this.xp = xp;
		this.gold = gold;
		this.sprinter = null;
	}

	update()
	{

    }

	toArray()
	{
		return [
			this.id,
			this.name,
			this.written,
			this.sprints,
			this.xp,
			this.gold,
		];
	}

}

module.exports = User;