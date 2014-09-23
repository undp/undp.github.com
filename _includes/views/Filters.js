views.Filters = Backbone.View.extend({
    initialize: function () {
        // the element of this view is passed when filters
        // are generated for their respective facets - see Facets.js
        this.listenTo(this.collection,'update',this.renderFilterList);

        var isThereDonorCountry = _(global.processedFacets).findWhere({ facet: 'donor_countries' }),
            donorCountry = (isThereDonorCountry) ? isThereDonorCountry.id : false;

        // populate filter list under facet
        // donorCountry only becomes a value under the donors collection
        if (this.collection.id === 'donors') {this.donorCountry = donorCountry;}

        // on generation of filters all entries are collapsed
        this.$el.toggleClass('filtered', false);
    },
    renderFilterList: function(keypress) {

        this.$el.html(templates.filters(this)); //  and view === this... TODO: see script.js
        global.description = global.description || [];
        global.donorDescription = global.donorDescription || [];
        global.donorTitle;

        var filterModels = this.collection.filter(function(model) {
            return (model.get('visible') && model.get('count') > 0);
        });

        _(filterModels).each(function(model) {
            // use the filter template
            this.$('.filter-items').append(templates.filter({ model: model }));

            // the filter clicked on is active
            $('#' + this.collection.id + '-' + model.id).toggleClass('active', model.get('active'));

            // add the selected filter to bread crumb
            if (model.get('active') && !keypress) {
                // var breadcrumbs = new views.Breadcrumbs();
                $('#breadcrumbs ul').append(
                    '<li><a href="' + BASE_URL +
                    document.location.hash.split('/')[0] + '/filter/' +
                    this.collection.id + '-' +
                    model.get('id') + '">' +
                    model.get('name').toLowerCase().toTitleCase() +
                    '</a></li>'
                );
                this.$el.toggleClass('filtered',true);
            } else {
                $('#' + this.collection.id + '-' + model.id).toggleClass('inactive',true);
            }

            // affecting description
            if (this.collection.id === 'operating_unit') {
                global.description.push(' for the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> office');
            }
            if (this.collection.id === 'region') {
                global.description.push(' in the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> region');
            }
            if (this.collection.id === 'donor_countries') {
                if (this.donorCountry === 'MULTI_AGY') {
                    global.donorTitle = '<strong>Multi-Lateral Agencies</strong>';
                    global.donorDescription = '<strong>Multi-Lateral Agencies</strong> fund <strong>' + global.projects.length +'</strong> ';
                } else if (this.donorCountry === 'OTH') {
                    global.donorTitle = '<strong>Uncategorized Organizations</strong>';
                    global.donorDescription = '<strong>Uncategorized Organizations</strong> fund <strong>' + global.projects.length +'</strong> ';
                } else {
                    global.donorTitle = '<strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>';
                    global.donorDescription = '<strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> funds <strong>' + global.projects.length +'</strong> ';
                }
            }
            if (this.collection.id === 'donors') {
                global.description.push(' through <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');

            }
            if (this.collection.id === 'focus_area') {
                global.description.push(' with a focus on <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');
            }
        },this);

        if (global.filtercounter !== facets.length ) {
            global.filtercounter = (global.filtercounter) ? global.filtercounter + 1 : 2;
        } else {
            global.filtercounter = 0;
            if (!keypress) global.projects.map.render();
        }

        // render map
        // if (!keypress) global.projects.map.render();
        if (!keypress) new views.Map();
        this.renderCharts();
    },

    renderCharts: function(){
            var view = this;

        //***********************
        // GET DATA
        //***********************

        // Get the chart data for the collection and put it in chartModels
        // if donorCountry is set, the chartModels == donorCountry
        if (this.donorCountry) {
            this.chartModels = this.collection.filter(function(model) {
                return (model.get('country') === this.donorCountry);
            });
        } else {
            // Creating chartModels array for top budget sources, filter through
            // more countries since the budget sources are calculated below,
            // resulting in a different number from budget
            this.chartModels = this.collection.chain()
                .sortBy(function(model) {
                    return -1 * model.get('expenditure') || 0;
                })
                .filter(function(model) {
                    return (model.get('expenditure') > 0);
                })
                .first(75)
                .value();
        }

        //***************************
        // START RENDERING
        //***************************
        $('#chart-' + this.collection.id + ' .rows').empty();
            // update hash for charts
            if (global.processedFacets.length === 0 ){
                var pathTo = '#filter/';
            } else {
                pathTo = document.location.hash + "/";
            };

        if (this.chartModels.length <= 1 && this.collection.id !== 'focus_area' && !this.donorCountry) {
            $('#chart-' + this.collection.id).css('display','none');
        }

        // What does full do??
        if ($('.stat-chart').hasClass('full')) {
            $('.stat-chart').removeClass('full');
            $('#chart-' + this.collection.id)
                .css('display','block');
        } else {
            $('#chart-' + this.collection.id)
                .addClass('full')
                .css('display','block');
        }

        //************************
        // RENDER Focus Area Chart
        //************************
        if (this.collection.id === 'focus_area') {
           renderFocusAreaChart(this.chartModels, pathTo, view);
        }

        //****************************
        // RENDER Budget Sources Chart
        //****************************

        if (this.collection.id === 'donors') {
            renderBudgetSourcesChart(this.chartModels, pathTo, view);
        }

        //******************************************
        // RENDER Recipient Offices Chart
        //******************************************
        if (this.collection.id === 'operating_unit') {
            renderRecipientOfficesChart(this.chartModels, view, pathTo)
        }

    }
});