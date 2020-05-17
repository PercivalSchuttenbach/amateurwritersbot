class Sprint
{
    constructor(id, enemyId, sprinters)
    {
        this.sprinters = this.addSprinters(sprinters);
        this.id = id;
        this.enemyId = enemyId;
        this.sprinterHighestWc = this.getSprinterWithHighestWc();
        this.totalWc = this.getTotalWc();
    }

    /**
     * Add sprinter data to sprint data
     * 
     * @param {any} sprinters
     */
    addSprinters(sprinters)
    {
        return sprinters.map(sprinter =>
        {
            const sprinterData = { sprinter, wc: sprinter.sprintWc, sprint: this };
            sprinter.sprints.push(sprinterData);
            sprinter.commit();

            return sprinterData;
        });
    }

    /*
     * Get the sprinter with highest wordcount
     */
    getSprinterWithHighestWc()
    {
        return this.sprinters.reduce((prev, current) => (prev.wc > current.wc) ? prev : current)
    }

    /**
     * Get total sprint wc
     */
    getTotalWc()
    {
        return this.sprinters.reduce((sum, sprinter) => sum + sprinter.wc, 0);
    }

}

module.exports = Sprint;