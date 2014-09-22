views.Filters = Backbone.View.extend({
    initialize: function () {
        this.collection.on('update', this.render, this);
    },
    render: function(keypress) {
        var view = this;
        setTimeout(function() {

            var filterModels = [],
                chartModels = [],
                active = view.collection.where({ active: true }),
                chartType = 'budget',
                donor = '';
                
            $('#' + view.collection.id).toggleClass('filtered', false);

            if (active.length) {
    
                // Use donor level financial data if available
                if (active[0].collection.id === 'donors') {
                    donor = active[0].id;
                    global.projects.map.collection.donorID = donor;
                }
                // Add a filtered class to all parent containers
                // where an active element has been selected.
                _(active).each(function(a) {
                    $('#' + a.collection.id).toggleClass('filtered', true);
                });
    
                // copy the collection twice for different usage
                filterModels = active;
                chartModels = active;
                filterCallback();

            } else {
                view.collection.sort();
                
                if (view.collection.id === 'donors') {
                    var donorCountry = _(global.processedFacets).where({ collection: 'donor_countries' });
                    donorCountry = (donorCountry.length) ? donorCountry[0].id : false;
                }

                setTimeout(function() {
                    filterModels = view.collection.chain().filter(function(model) {
                        // Filter donors on active donor country
                        var donorCountryFilter = (donorCountry) ? (model.get('country') === donorCountry) : true;

                        return (model.get('visible') && model.get('count') > 0 && donorCountryFilter);

                    }).value();
                    filterCallback();
                }, 0);

                if (donorCountry) {
                    chartModels = view.collection.chain()
                        .filter(function(model) {
                            return (model.get('country') === donorCountry);
                        }).value();
                } else if (view.collection.id == 'donors'){
                    // Creating chartModels array for top budget sources, filter through 
                    // more countries since the budget sources are calculated below, 
                    // resulting in a different number than budget
                    chartModels = view.collection.chain()
                        .sortBy(function(model) {
                            return -1 * model.get('expenditure') || 0;
                        })
                        .filter(function(model) {
                            return (model.get('expenditure') > 0);
                        })
                        .first(75)
                        .value(); // Top 20
                } else {
                    // Top 20 donors, donor_countries, and operating_unit
                    chartModels = view.collection.chain()
                        .sortBy(function(model) {
                            return -1 * model.get('expenditure') || 0;
                        })
                        .filter(function(model) {
                            return (model.get('expenditure') > 0);
                        })
                        .first(20)
                        .value(); // Top 20
                }
                if (view.collection.id === 'operating_unit') {
                    $('#applied-filters').addClass('no-country');
                }
                if (view.collection.id === 'region') {
                    $('#applied-filters').addClass('no-region');
                }
            }

            function filterCallback() {
                if (filterModels.length) {
                    view.$el.html(templates.filters(view)); //  and view === this... TODO: see script.js
                    global.description = global.description || [];
                    global.donorDescription = global.donorDescription || [];
                    global.donorTitle;
        
                    _(filterModels).each(function(model) {
        
                        view.$('.filter-items').append(templates.filter({ model: model }));
                        $('#' + view.collection.id + '-' + model.id).toggleClass('active', model.get('active'));

                        if (model.get('active') && !keypress) {
                            // var breadcrumbs = new views.Breadcrumbs();
                            $('#breadcrumbs ul').append(
                                '<li><a href="' + BASE_URL +
                                document.location.hash.split('/')[0] + '/filter/' +
                                view.collection.id + '-' +
                                model.get('id') + '">' +
                                model.get('name').toLowerCase().toTitleCase() +
                                '</a></li>'
                            );

                            // this can benefit from smaller views where each
                            // facet has its own description
                            if (view.collection.id === 'operating_unit') {
                                global.description.push(' for the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> office');
                            }
                            if (view.collection.id === 'region') {
                                global.description.push(' in the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> region');
                            }
                            if (view.collection.id === 'donor_countries') {
                                if (donorCountry === 'MULTI_AGY') {
                                    global.donorTitle = '<strong>Multi-Lateral Agencies</strong>';
                                    global.donorDescription = '<strong>Multi-Lateral Agencies</strong> fund <strong>' + global.projects.length +'</strong> ';
                                } else if (donorCountry === 'OTH') {
                                    global.donorTitle = '<strong>Uncategorized Organizations</strong>';
                                    global.donorDescription = '<strong>Uncategorized Organizations</strong> fund <strong>' + global.projects.length +'</strong> ';
                                } else {
                                    global.donorTitle = '<strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>';
                                    global.donorDescription = '<strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> funds <strong>' + global.projects.length +'</strong> ';
                                }
                            }
                            if (view.collection.id === 'donors') {
                                global.description.push(' through <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');

                            }
                            if (view.collection.id === 'focus_area') {
                                global.description.push(' with a focus on <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');
                            }
                        }
                    });
                } else {
                    view.$el.empty();
                }

                if (global.filtercounter !== facets.length ) {
                    global.filtercounter = (global.filtercounter) ? global.filtercounter + 1 : 2;
                } else {
                    global.filtercounter = 0;
                    if (!keypress) global.projects.map.render();
                }

            }
    
            $('#chart-' + view.collection.id + '.rows').empty();

            var pathTo;
            // update hash for charts
            if (global.processedFacets.length === 0 ){
                pathTo = '#' + CURRENT_YR +'/filter/';
            } else {
                pathTo = document.location.hash + "/";
            };

            //Fixes hrefs for embed
           pathTo = (pathTo.split('?')[0] + '/').replace('widget', 'filter');

            if (chartModels.length <= 1 && view.collection.id !== 'focus_area' && !donorCountry) {
                $('#chart-' + view.collection.id)
                    .css('display','none');
            } else {
                if ($('.stat-chart').hasClass('full')) {
                    $('.stat-chart').removeClass('full');
                    $('#chart-' + view.collection.id)
                        .css('display','block');
                } else {
                    $('#chart-' + view.collection.id)
                        .addClass('full')
                        .css('display','block');
                }
    
                if (view.collection.id === 'focus_area') {
                    var $el = $('#chart-focus_area');
                        $el.empty();
    
                    chartModels = view.collection.models;
    
                    var total = _(chartModels).reduce(function(memo, model) {
                        return memo + (model.get('budget') || 0 );
                    }, 0) || 0;
    
                    _(chartModels).each(function(model, i) {
                        var focusIconClass = model.get('name').replace(/\s+/g, '-').toLowerCase().split('-')[0];
                        var focusName = model.get('name').toLowerCase().toTitleCase();
    
                        var value = _(((model.get('budget') || 0) / total)).isNaN() ? 0 :
                                ((model.get('budget') || 0) / total * 100).toFixed(0);

                        $el.append(
                            '<li class="focus fa' + model.id + '">' +
                            '  <a target="_blank" href="' + '/'+ pathTo + view.collection.id + '-' + model.id + '" class="focus-title">' + focusName + '</a>' +
                            '  <p class="pct"><span class="' + focusIconClass + '"></span></p>' +
                            '</li>'
                        );

                        $('.fa' + (model.id) + ' .pct span')
                            .css('width',value * 2) // the width of the percentage block corresponds to the value visually, times 2 to make it legible
                            .text(value === '0' ? value : value + '%');
                    });

                    $el.prepend('<h3 id="focus">Themes <span>% of budget</span></h3>');
                } else if (view.collection.id === 'operating_unit' || view.collection.id === 'donors' || view.collection.id === 'donor_countries') {

                    donor = (_(global.processedFacets).find(function(filter) {
                            return filter.collection === 'donors';
                        }) || {id: 0}).id;
                    donor_ctry = (_(global.processedFacets).find(function(filter) {
                            return filter.collection === 'donor_countries';
                        }) || {id: 0}).id;

                    var max = '',
                        rows = [],
                        newWidth = 1;
    
                    $('#chart-' + view.collection.id + ' .rows').html('');
                    var status = 1,
                        processes = chartModels.length;

                    _(chartModels).each(function(model) {

                        setTimeout(function() {

                            if (view.collection.id === 'donors') {
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
                            /* Akshay- before was M now so commenting out to show all figures ange getting rid of M.                        was
                            var budget = accounting.formatMoney(
                                        ((donor || donor_ctry) ? donorBudget : model.get('budget')) / 1000000
                                    ) + 'M';
                            */

                            var budget = accounting.formatMoney(
                                        ((donor || donor_ctry) ? donorBudget : model.get('budget')),"$", 0, ",", "."
                                    );
        
                            var budgetWidth = (donor || donor_ctry) ? (donorBudget) : (model.get('budget'));
                            var expenditureWidth = (donor || donor_ctry) ? (donorExpenditure) : (model.get('expenditure'));

                            var caption = '<a target="_blank" href="' + '/' + pathTo + model.collection.id + '-' + model.get('id') +
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
                                callback();
                            } else {
                                status++;
                            }

                        }, 0);
    
                    });

                    function callback() {
                        rows = _(rows).sortBy('sort');
                        max = rows[0].sort * -1;
                        rows = rows.slice(0,19);

                        _(rows).each(function(row) {
                            $('#chart-' + view.collection.id + ' .rows').append(row.content);
                        });
                        $('#chart-' + view.collection.id + ' .rows tr').each(function() {
                            $('.data .budgetdata', this).width(($('.data .budgetdata', this).attr('data-budget') / max * 100) + '%');
                            $('.data .subdata', this).width(($('.data .subdata', this).attr('data-expenditure') / max * 100) + '%');
                        });
                        if (donorCountry) $('#total-donors').html(chartModels.length);
                    }
    
                }
            }
        }, 0);
    }
});



