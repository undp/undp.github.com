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
        this.on('reset', this.update, this);
        setTimeout(_(this.cb).bind(collection), 1);
    },
    update: function() {

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
            if (facet.id == 'donor_countries') {
                this[facet.id] = _(this.pluck(facet.id))
                    .chain()
                    .map(function(v) {
                        return _(v.sort()).uniq(true);
                    })
                    .flatten()
                    .countBy(function(n) { return n; })
                    .value();
            } else {
                this[facet.id] = _(this.pluck(facet.id))
                    .chain()
                    .flatten()
                    .countBy(function(n) { return n; })
                    .value();
            }
            calc(this,facet.id,'budget');
            calc(this,facet.id,'expenditure');
        }, this);


        // Total budget
        this.budget = this.reduce(function(memo, project) {
            return memo + parseFloat(project.get('budget'));
        }, 0);

        // Donor budgets
        this.donorBudget = this.reduce(function(memo, project) {
            _(project.get('donors')).each(function(donor, i) {
                var budget = project.get('donor_budget')[i] || 0;
                memo[donor] = memo[donor] +  budget || budget;
            });
            return memo;
        }, {});

        // Total expenditure
        this.expenditure = this.reduce(function(memo, project) {
            return memo + parseFloat(project.get('expenditure'));
        }, 0);

        // Donor expenditure
        this.donorExpenditure = this.reduce(function(memo, project) {
            _(project.get('donors')).each(function(donor, i) {
                var budget = project.get('donor_expend')[i] || 0;
                memo[donor] = memo[donor] +  budget || budget;
            });
            return memo;
        }, {});
        
        this.trigger('update');
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
