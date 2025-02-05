views.ProjectItemList = Backbone.View.extend({
    el: '#project-items',
    template: _.template($('#projectItemList').html()),
    events: {
        'click .load a': 'loadMore',
        'click table tr td:first-child a': 'routeToProject',
        'click #project-table th': 'sortProjects'
    },

    initialize: function() {
        this.$el.html(this.template());
        this.$subEl = $(('#project-table tbody'),this.$el);

        this.collection.on('update', this.render, this);
        $('#projects input[type="search"]').on('keyup', _.bind(this.search, this));

        this.low = 50,
        this.high = 100;

        this.$subEl.empty();

        var pageType = Backbone.history.location.hash.split('/')[1];

        if (pageType == 'widget'){
            this.subTemplate = _.template($('#embedProjectItem').html());
        } else {
            this.subTemplate = _.template($('#projectItem').html());
        }
    },

    render: function() {
        setTimeout(function() {
        var donor = _(global.processedFacets).find(function(filter) {
                return filter.collection === 'donors';
            }),
            donor_ctry = _(global.processedFacets).find(function(filter) {
                return filter.collection === 'donor_countries';
            }),
            models = _(this.collection.filter(function(model) {
                return model.get('visible');
            }));

            models = models.first(50);

        $('#total-count').html(accounting.formatNumber(this.collection.length));

        if (donor) {
            $('#total-donors').parent().hide();
            if (global.projects.map.updateMap) {
                var $target = $('.layers li:first a');
                $('.map-btn').removeClass('active');
                $target.addClass('active');
                global.projects.map.updateMap($target.attr('data-value'));
            }

        } else {
            $('#total-donors').parent().show();
            $('#total-donors').html(accounting.formatNumber(_(this.collection.donors).size()));
        }
        
        if (donor) {
            $('#total-budget').html(accounting.formatMoney(this.collection.donorBudget[donor.id] / 1000000) + 'M');
        } else if (donor_ctry) {
            $('#total-budget').html(accounting.formatMoney(this.collection.ctryBudget[donor_ctry.id] / 1000000) + 'M');
        } else {
            $('#total-budget').html(accounting.formatMoney(this.collection.budget / 1000000) + 'M');
        }

        if (donor) {
            $('#total-expenditure').html(accounting.formatMoney(this.collection.donorExpenditure[donor.id] / 1000000) + 'M');
        } else if (donor_ctry) {
            $('#total-expenditure').html(accounting.formatMoney(this.collection.ctryExpenditure[donor_ctry.id] / 1000000) + 'M');
        } else {
            $('#total-expenditure').html(accounting.formatMoney(this.collection.expenditure / 1000000) + 'M');
        }
        if (models.length) {

            this.$subEl.empty();

            _(models).each(function(model) {
                this.$subEl.append(this.subTemplate({ model:model }));
            },this)

           if (models.length < 50) {
                $('.load').hide();
            } else {
                $('.load').show();
            }
        } else {
            this.$('.load').hide();
            this.$subEl.empty().append('<tr><td><em>No projects</em></td><td></td><td></td></tr>');

        }

        return this;
        }.bind(this), 500);
    },

    loadMore: function(e) {
        var self = this;
        this.low = this.high;
        this.high += 50;

        var models = _(this.collection.filter(function(model) {
                return model.get('visible');
            })).slice(self.low,self.high);

        if (models.length) {
            _(models).each(function(model) {
                this.$subEl.append(this.subTemplate({ model:model }));
            },this)
        } else {
            $(e.target).text('All Projects Loaded').addClass('disabled');
        }

        return false;
    },

    routeToProject: function(e) {
        var id = $(e.currentTarget).attr('id');
        // use real links in widgets
        if (typeof id !== "undefined") {
            e.preventDefault();
            global.navigate('#project/'+id, {trigger: true});
        }
    },

    search: function (e) {
        var view = this;

        // pasted values seem to need this delay
        window.setTimeout(function() {
            var $target = $(e.target),
                val = $target.val().toLowerCase(),
                mode = (val.substr(0, 3) === '000') ? 'id' : 'name';

            $target.parent().find('.reset').toggleClass('hidden', (val === ''));

            view.collection.each(function(model) {
                var name = model.get(mode).toLowerCase();

                if (val === '' || name.indexOf(val) >= 0) {
                    model.set('visible', true);
                } else {
                    model.set('visible', false);
                }
            });

            view.render();
        }, 100);
    },

    sortProjects: function(e) {
        var that = this.collection,
            $target = $(e.target);

        e.preventDefault();
        e.stopPropagation();
        $('.table th').removeClass('sort-down sort-up');

        // Toggle sorting by descending/ascending
        if ($target.attr('data-sort') == that.sortData) {
            if (that.sortOrder == 'desc') {
                that.sortOrder = 'asc';
                if (that.sortData == 'name') {
                    $target.addClass('sort-up');
                } else {
                    $target.addClass('sort-down');
                }
            } else {
                that.sortOrder = 'desc';
                if (that.sortData == 'name') {
                    $target.addClass('sort-down');
                } else {
                    $target.addClass('sort-up');
                }
            }
        } else {
            that.sortData = $target.attr('data-sort');
            that.sortOrder = (that.sortData == 'name') ? 'asc' : 'desc';
            $target.addClass('sort-up');
        }

        this.collection.models = _.sortBy(that.models, function(model) {
            if (that.sortOrder == 'desc') {
                if (that.sortData == 'name') {
                    return -model.get(that.sortData).toLowerCase().charCodeAt(0);
                } else {
                    return -model.get(that.sortData);
                }
            } else {
                return model.get(that.sortData);
            }
        });

        this.render();
    }
});
