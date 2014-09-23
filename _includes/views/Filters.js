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

            // chartModels
            if (this.donorCountry) {
                this.chartModels = this.collection.filter(function(model) {
                    return (model.get('country') === donorCountry);
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

            // start chart rendering
            $('#chart-' + this.collection.id + '.rows').empty();

            // update hash for charts
            if (global.processedFacets.length === 0 ){
                var pathTo = '#filter/';
            } else {
                pathTo = document.location.hash + "/";
            };

            if (this.chartModels.length <= 1 && this.collection.id !== 'focus_area' && !this.donorCountry) {
                $('#chart-' + this.collection.id)
                    .css('display','none');
            } else {
                if ($('.stat-chart').hasClass('full')) {
                    $('.stat-chart').removeClass('full');
                    $('#chart-' + this.collection.id)
                        .css('display','block');
                } else {
                    $('#chart-' + this.collection.id)
                        .addClass('full')
                        .css('display','block');
                }

                if (this.collection.id === 'focus_area') {
                    var $el = $('#chart-focus_area');

                    $el.empty();

                    this.chartModels = this.collection.models;

                    var total = _(this.chartModels).reduce(function(memo, model) {
                        return memo + (model.get('budget') || 0 );
                    }, 0) || 0;

                    _(this.chartModels).each(function(model, i) {
                        var focusIconClass = model.get('name').replace(/\s+/g, '-').toLowerCase().split('-')[0];
                        var focusName = model.get('name').toLowerCase().toTitleCase();

                        var value = _(((model.get('budget') || 0) / total)).isNaN() ? 0 :
                                ((model.get('budget') || 0) / total * 100).toFixed(0);

                        $el.append(
                            '<li class="focus fa' + model.id + '">' +
                            '  <a href="'+ pathTo + view.collection.id + '-' + model.id + '" class="focus-title">' + focusName + '</a>' +
                            '  <p class="pct"><span class="' + focusIconClass + '"></span></p>' +
                            '</li>'
                        );

                        $('.fa' + (model.id) + ' .pct span')
                            .css('width',value * 2) // the width of the percentage block corresponds to the value visually, times 2 to make it legible
                            .text(value === '0' ? value : value + '%');
                    });

                    $el.prepend('<h3 id="focus">Themes <span>% of budget</span></h3>');

                } else if (this.collection.id === 'operating_unit' || this.collection.id === 'donors' || this.collection.id === 'donor_countries') {

                    var donor = (_(global.processedFacets).find(function(filter) {
                            return filter.facet === 'donors';
                        }) || {id: 0}).id;

                    var donor_ctry = (_(global.processedFacets).find(function(filter) {
                            return filter.facet === 'donor_countries';
                        }) || {id: 0}).id;

                    var max = '',
                        rows = [],
                        newWidth = 1;

                    $('#chart-' + this.collection.id + ' .rows').html('');

                    var status = 1,
                        processes = this.chartModels.length;

                    _(this.chartModels).each(function(model) {

                        if (this.collection.id === 'donors') {
                            donor = model.id;

                            var donorProjects = (donor) ? global.projects.chain()
                                .map(function(project) {
                                    var donorIndex = _(project.get('donors')).indexOf(donor);
                                    if (donorIndex === -1) return;
                                    return {
                                        budget: project.get('donor_budget')[donorIndex],
                                        expenditure: project.get('donor_expend')[donorIndex]
                                    };
                                }, 0).compact().value() : [];

                            var donorBudget = _(donorProjects).chain().pluck('budget')
                                .reduce(function(memo, num){ return memo + num; }, 0).value();

                            var donorExpenditure = _(donorProjects).chain().pluck('expenditure')
                                .reduce(function(memo, num){ return memo + num; }, 0).value();

                            if (donor || donor_ctry) {
                                if (donor) global.projects.map.collection.donorID = false;
                                global.projects.map.collection.donorBudget[donor] = donorBudget;
                                global.projects.map.collection.donorExpenditure[donor] = donorExpenditure;
                            }

                        } else {
                            if (donor_ctry) {
                                var donorBudget = global.projects.chain()
                                    .filter(function(project) {
                                        return project.get('operating_unit') === model.id;
                                    })
                                    .reduce(function(memo, project) {
                                        _.each(project.get('donor_countries'), function(v,i) {
                                            if (v === donor_ctry) {
                                                memo = memo + project.get('donor_budget')[i];
                                            }
                                        });
                                        return memo;
                                    }, 0).value();
                                var donorExpenditure = global.projects.chain()
                                    .filter(function(project) {
                                        return project.get('operating_unit') === model.id;
                                    })
                                    .reduce(function(memo, project) {
                                        _.each(project.get('donor_countries'), function(v,i) {
                                            if (v === donor_ctry) {
                                                memo = memo + project.get('donor_expend')[i];
                                            }
                                        });
                                        return memo;
                                    }, 0).value();
                            } else {
                                var donorBudget = (donor) ? global.projects.chain()
                                        .filter(function(project) {
                                            return project.get('operating_unit') === model.id;
                                        })
                                        .reduce(function(memo, project) {
                                            var donorIndex = _(project.get('donors')).indexOf(donor);
                                            if (donorIndex === -1) return memo;
                                            return memo + project.get('donor_budget')[donorIndex];
                                        }, 0).value() : 0;
                                var donorExpenditure = (donor) ? global.projects.chain()
                                        .filter(function(project) {
                                            return project.get('operating_unit') === model.id;
                                        })
                                        .reduce(function(memo, project) {
                                            var donorIndex = _(project.get('donors')).indexOf(donor);
                                            if (donorIndex === -1) return memo;
                                            return memo + project.get('donor_expend')[donorIndex];
                                        }, 0).value() : 0;
                            }
                            if (donor || donor_ctry) {
                                if (donor) global.projects.map.collection.donorID = false;
                                global.projects.map.collection.operating_unitBudget[model.get('id')] = donorBudget;
                                global.projects.map.collection.operating_unitExpenditure[model.get('id')] = donorExpenditure;
                            }
                        }

                        var budget = accounting.formatMoney(
                                    ((donor || donor_ctry) ? donorBudget : model.get('budget')),"$", 0, ",", "."
                                );

                        var budgetWidth = (donor || donor_ctry) ? (donorBudget) : (model.get('budget'));
                        var expenditureWidth = (donor || donor_ctry) ? (donorExpenditure) : (model.get('expenditure'));

                        var caption = '<a href="' + pathTo + model.collection.id + '-' + model.get('id') +
                            '">' + model.get('name').toLowerCase().toTitleCase() + '</a>';
                        var bar = '<div class="budgetdata" data-budget="' + budgetWidth + '"></div>' + '<div class="subdata" data-expenditure="' + expenditureWidth + '"></div>';
                        if (budget!='$0'){
                            rows.push({
                                sort: -1 * ((donor || donor_ctry) ? donorBudget : model.get('budget')),
                                content: '<tr>' +
                                    '    <td>' + caption + '</td>' +
                                    '    <td class="right">' + budget + '</td>' +
                                    '    <td class="data">' + bar + '</td>' +
                                    '</tr>'
                            });
                        }

                        if (status === processes) {
                            rows = _(rows).sortBy('sort');
                            max = rows[0].sort * -1;
                            rows = rows.slice(0,19);

                            _(rows).each(function(row) {
                                $('#chart-' + this.collection.id + ' .rows').append(row.content);
                            },this);
                            $('#chart-' + this.collection.id + ' .rows tr').each(function() {
                                $('.data .budgetdata', this).width(($('.data .budgetdata', this).attr('data-budget') / max * 100) + '%');
                                $('.data .subdata', this).width(($('.data .subdata', this).attr('data-expenditure') / max * 100) + '%');
                            });
                            if (this.donorCountry) $('#total-donors').html(this.chartModels.length);
                        } else {
                            status++;
                        }


                    },this);
                }
            }
        }
});