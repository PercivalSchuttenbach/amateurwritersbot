class Sprint
{
    constructor(id, enemyId, sprinters=null)
    {
        this.sprinters = sprinters ? this.addSprinters(sprinters) : [];
        this.id = id;
        this.enemyId = enemyId;
        this.sprinterWithHighestWc = null;
        this.totalWc = null;
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
        if (!this.sprinterWithHighestWc) {
            this.sprinterWithHighestWc = this.sprinters.reduce((prev, current) => (prev.wc > current.wc) ? prev : current);
        }
        return this.sprinterWithHighestWc;
    }

    /**
     * Get total sprint wc
     */
    getTotalWc()
    {
        if (!this.totalWc) {
            this.totalWc = this.sprinters.reduce((sum, sprinter) => sum + sprinter.wc, 0);
        }
        return this.totalWc;
    }

    /* Convert sprint data to array */
    toArray()
    {
        return this.sprinters.map(({ sprinter, wc }) => [this.id, this.enemyId, sprinter.id, wc]);
    }

    /**
     * Fill from spreadsheet
     * 
     * @param {any} sprinter
     * @param {any} wc
     */
    fill(sprinter, wc)
    {
        this.sprinters.push({sprinter, wc, sprint: this});
    }

}

module.exports = Sprint;