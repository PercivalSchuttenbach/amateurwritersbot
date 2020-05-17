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
    addSprint(enemy_id, sprinters)
    {
        const sprint = new Sprint(++this.increment, enemy_id, sprinters);
        this.sprints.push(sprint);

        return sprint;
    }

    /**
     * Add data of sprinter(s)
     */
    addSprinter(sprinter)
    {
        if (Array.isArray(sprinter)) {
            this.sprinters = sprinter.map((row) =>
            {
                //@todo add member data in event.js after setUp

                //const member = this.channel.members.get(row[0]);
                //if (member) {
                //    row[1] = member.displayName;
                //    row.push(member.user.avatarURL());
                //    row.push(member);
                //}
                return new Sprinter(row);
            });
        }
    }

    /**
     * Get total wordcount of all sprints
     */
    get totalWc()
    {
        this.sprints.reduce((sum, sprint) => sum + sprint.totalWc, 0);
    }

    mostSprints()
    {
        //@toto add Sprinters to SprintManager
    }

}

module.exports = SprintManager;