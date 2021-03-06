const Sprint = require('./sprint');
const Sprinter = require('./sprinter');

class SprintManager
{

    constructor()
    {
        this.sprints = [];
        this.sprinters = [];
        this.increment = 0;
    }

   /**
   * Add data of current sprint
   */
    addSprint(enemy_id)
    {
        const sprint = new Sprint(++this.increment, enemy_id, this.sprinters.filter(sprinter => sprinter.sprintWc));
        this.sprints.push(sprint);

        return sprint;
    }

    /**
     * Populate from spreadsheet
     * 
     * @param {any} rows
     */
    fillSprints(rows)
    {
        this.sprints = rows.reduce((collect, row) =>
        {
            let [sprint_id, enemy_id, sprinter_id, wc] = row;
            //If sprint does not exist yet create it
            if (!collect[sprint_id]) collect[sprint_id] = new Sprint(parseInt(sprint_id), parseInt(enemy_id));
            //Get sprinter and push spritns to own array
            const sprinter = this.sprinters.find(({ id }) => id === sprinter_id);
            wc = parseInt(wc);
            //add sprinter to sprint with wc
            collect[sprint_id].fill(sprinter, wc);
            sprinter.sprints.push({ wc: wc, sprint: collect[sprint_id] });
            
            this.increment = sprint_id;
            return collect;
        }, []);
    }

    /**
     * Add data of sprinter(s)
     */
    addSprinter(data, member = null)
    {
        if (Array.isArray(data)) {
            this.sprinters = data.map((row) => new Sprinter(row));
            return;
        }

        const sprinter = new Sprinter([data]);
        this.insertMemberData(sprinter, member);
        this.sprinters.push(sprinter);

        return sprinter;
    }

    /**
     * Insert member data into sprinter
     * 
     * @param {any} sprinter
     * @param {any} member
     */
    insertMemberData(sprinter, member)
    {
        if (member) {
            sprinter.member = member;
            sprinter.name = member.displayName;
            sprinter.thumbnail = member.user.avatarURL();
        }
    }

    /**
     * Add member data for each sprinter
     * 
     * @param {any} members
     */
    addMemberData(members)
    {
        this.sprinters.forEach(sprinter => this.insertMemberData(sprinter, members.get(sprinter.id)) );
    }
    /**
     * Get total wordcount of all sprints
     */
    get totalWc()
    {
        return this.sprints.reduce((sum, sprint) => sum + sprint.getTotalWc(), 0);
    }

    /**
     * Get sprinter by id
     * 
     * @param {any} sprinter_id
     */
    getSprinter(sprinter_id)
    {
        return this.sprinters.find(({ id }) => id === sprinter_id);
    }

    /**
    * @return array
    */
    getSprinters()
    {
        return this.sprinters;
    }

    /**
    * @return array
    */
    getCurrentSprinters()
    {
        return this.sprints[this.sprints.length - 1].sprinters.map(({ sprinter, wc }) => { return { ...sprinter, sprintWc: wc }});
    }

    /*
     * Sprinters to data
     * */
    get sprintersData()
    {
        return this.sprinters.map(sprinter => sprinter.toArray());
    }

    /* Sprints to data */
    get sprintsData()
    {
        return this.sprints.flatMap(sprint => sprint.toArray());
    }

    /**
     * Clear Sprint data
     */
    clear()
    {
        this.sprints = [];
        this.sprinters = [];
        this.increment = 0;
    }

}

module.exports = SprintManager;