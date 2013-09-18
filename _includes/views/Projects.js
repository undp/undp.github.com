views.Projects = Backbone.View.extend({
    el: '#project-items',
    events: {
        'click .load a': 'loadMore',
        'click table tr': 'routeToProject',
        'click #project-table th': 'sortProjects'
    },

    initialize: function() {
        this.$el.html(templates.projects(this));
        this.collection.on('update', this.render, this);
        $('#projects input[type="search"]').on('keyup', _.bind(this.search, this));

        this.low = 50,
        this.high = 100;
    },

    render: function() {

        var pageType = Backbone.history.fragment.split('/')[0];

        var donor = _(app.app.filters).find(function(filter) {
                return filter.collection === 'donors';
            }),
            models = _(this.collection.filter(function(model) {
                return model.get('visible');
            }));

        models = (pageType === 'widget') ? models.first(10) : models.first(50);

        $('#total-count').html(accounting.formatNumber(this.collection.length));

        if (donor) {
            $('#total-donors').parent().hide();
            if (app.projects.map.updateMap) {
                var $target = $('.layers li:first a');
                $('.map-btn').removeClass('active');
                $target.addClass('active');
                app.projects.map.updateMap($target.attr('data-value'));
            }

        } else {
            $('#total-donors').parent().show();
            $('#total-donors').html(accounting.formatNumber(_(this.collection.donors).size()));
        }
        $('#total-budget').html(
            (donor) ?  accounting.formatMoney(this.collection.donorBudget[donor.id] / 1000000) + 'M' :
            accounting.formatMoney(this.collection.budget / 1000000) + 'M'
        );

        $('#total-expenditure').html(
            (donor) ?  accounting.formatMoney(this.collection.donorExpenditure[donor.id] / 1000000) + 'M' :
            accounting.formatMoney(this.collection.expenditure / 1000000) + 'M'
        );

        if (models.length) {
            this.$('#project-table tbody').empty();
            _(models).each(function(model) {
                this.$('#project-table tbody').append(templates.project({ model: model }));
            });
            if (pageType === 'widget') {
                if (models.length < 10) {
                    $('.load').hide();
                } else {
                    $('.load').show();
                }
            } else {
               if (models.length < 50) {
                    $('.load').hide();
                } else {
                    $('.load').show();
                }
            }
        } else {
            this.$('.load').hide();
            this.$('#project-table tbody').empty().append('<tr><td><em>No projects</em></td><td></td><td></td></tr>');

        }

        return this;
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
                this.$('#project-table tbody').append(templates.project({ model: model }));
            });
        } else {
            $(e.target).text('All Projects Loaded').addClass('disabled');
        }

        return false;
    },

    routeToProject: function(e) {
        var id = $(e.currentTarget).attr('id');
        app.navigate(id, {trigger: true});
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
