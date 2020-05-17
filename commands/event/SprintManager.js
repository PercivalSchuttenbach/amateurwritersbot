const Sprint = require('./event/sprint');

class SprintManager
{

    constructor()
    {
        this.sprints = [];
        this.increment = 0;
    }

   /**
   * Add data of current sprint
   */
    addSprint(enemy_id, sprinters)
    {
        const sprint = new Sprint(++this.increment, enemy_id, sprinters);
        this.sprints.push(sprint);
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