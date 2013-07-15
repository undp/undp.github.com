// Model
models.Project = Backbone.Model.extend({
    defaults: { visible: true },
    url: function() {
        return 'api/projects/' + this.get('id') + '.json';
    }
});

// Collection
models.Projects = Backbone.Collection.extend({
    initialize: function() {
        this.sortData = this.sortData || 'budget';
        this.sortOrder = this.sortOrder || 'desc';
    },
    watch: function() {
        var collection = this;
        this.update();
        collection.on('reset', this.update, this);
    },
    update: function() {
        var collection = this,
            processes = 3 + facets.length,
            status = 0;

        if (!this.length) return false;
        
        function calc(that,facet,category) {
            that[facet + category.capitalize()] = _.reduce(that.models, function(res,obj) {
                if (_.isArray(obj.attributes[facet])) {
                    _.each(obj.attributes[facet], function(o) {
                        if (!(o in res)) {
                            res[o] = obj.attributes[category];
                        } else {
                            res[o] += obj.attributes[category];
                        }
                    });
                } else {
                    if (!(obj.attributes[facet] in res)) {
                        res[obj.attributes[facet]] = obj.attributes[category];
                    } else {
                        res[obj.attributes[facet]] += obj.attributes[category];
                    }
                }
                return res;
            }, {});
        }


            // Count projects for each facet
            _(facets).each(function(facet) {
                setTimeout(function() {
                    var subStatus = 0,
                        subProcesses = 1;

                    if (facet.id == 'donor_countries') {
                        collection[facet.id] = _(collection.pluck(facet.id))
                            .chain()
                            .map(function(v) {
                                //return _(v.sort()).uniq(true);
                            })
                            .flatten()
                            .countBy(function(n) { return n; })
                            .value();
                    } else {
                        collection[facet.id] = _(collection.pluck(facet.id))
                            .chain()
                            .flatten()
                            .countBy(function(n) { return n; })
                            .value();

                        if (facet.id == 'operating_unit') {
                            collection[facet.id + 'Sources'] = _(collection.models).chain()
                                .groupBy(function(model) { return model.get(facet.id); })
                                .reduce(function(memo, models, unit) {
                                    memo[unit] = _(models).chain().pluck('attributes').pluck('donors').flatten().uniq().size().value();
                                    return memo;
                                }, {}).value();
                        }
                    }

                    setTimeout(function() {
                        calc(collection,facet.id,'budget');
                        if (subStatus === subProcesses) {
                            subCallback();
                        } else {
                            subStatus++;
                        }
                    }, 0);

                    setTimeout(function() {
                        calc(collection,facet.id,'expenditure');
                        if (subStatus === subProcesses) {
                            subCallback();
                        } else {
                            subStatus++;
                        }
                    }, 0);

                    function subCallback() {
                        if (status === processes) {
                            callback();
                        } else {
                            status++;
                        }
                    }

                }, 0);

            }, collection);

        setTimeout(function() {
            // Total budget
            collection.budget = collection.reduce(function(memo, project) {
                return memo + parseFloat(project.get('budget'));
            }, 0);
            if (status === processes) {
                callback();
            } else {
                status++;
            }
        }, 0);

        setTimeout(function() {
            // Donor budgets
            collection.donorBudget = collection.reduce(function(memo, project) {
                _(project.get('donors')).each(function(donor, i) {
                    var budget = project.get('donor_budget')[i] || 0;
                    memo[donor] = memo[donor] +  budget || budget;
                });
                return memo;
            }, {});
            if (status === processes) {
                callback();
            } else {
                status++;
            }
        }, 0);

        setTimeout(function() {
            // Total expenditure
            collection.expenditure = collection.reduce(function(memo, project) {
                return memo + parseFloat(project.get('expenditure'));
            }, 0);
            if (status === processes) {
                callback();
            } else {
                status++;
            }

        }, 0);

        setTimeout(function() {
            // Donor expenditure
            collection.donorExpenditure = collection.reduce(function(memo, project) {
                _(project.get('donors')).each(function(donor, i) {
                    var budget = project.get('donor_expend')[i] || 0;
                    memo[donor] = memo[donor] +  budget || budget;
                });
                return memo;
            }, {});
            if (status === processes) {
                callback();
            } else {
                status++;
            }

        }, 0);
        
        function callback() {
            collection.trigger('update');
            _(collection.cb).bind(collection)();
        }

    },
    model: models.Project,
    comparator: function(model) {
        if (this.sortOrder == 'desc') {
            if (this.sortData == 'name') {
                return -model.get(this.sortData).toLowerCase().charCodeAt(0);
            } else {
                return -model.get(this.sortData);
            }    
        } else {
            return model.get(this.sortData);
        }
    } 
});
