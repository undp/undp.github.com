views.Filters = Backbone.View.extend({
    initialize: function () {
        this.collection.on('update', this.render, this);
    },
    render: function(keypress) {
        var view = this,
            filterModels = [],
            chartModels = [],
            active = this.collection.where({ active: true }),
            chartType = 'budget',
            chartTypeExp = 'expenditure',
            donor = '';
            
        $('#' + this.collection.id).toggleClass('filtered', false);

        if (active.length) {

            // Use donor level financial data if available
            if (active[0].collection.id === 'donors') donor = active[0].id;

            // Add a filtered class to all parent containers
            // where an active element has been selected.
            _(active).each(function(a) {
                $('#' + a.collection.id).toggleClass('filtered', true);
            });

            filterModels = active;
            chartModels = active;
        } else {
            this.collection.sort();

            filterModels = this.collection.chain().filter(function(model) {
                    var length = (model.collection.where({ visible: true }).length > 100) ? 1 : 0;
                    return (model.get('visible') && model.get('count') > length);
                }).first(50).value();

            chartModels = this.collection.chain()
                .sortBy(function(model) {
                    return -1 * model.get(chartType) || 0;
                })
                .filter(function(model) {
                    return (model.get(chartType) > 0);
                })
                .first(20).value();

            if (this.collection.id === 'operating_unit') {
                $('#applied-filters').addClass('no-country');
            }
            if (this.collection.id === 'region') {
                $('#applied-filters').addClass('no-region');
            }
        }

        if (filterModels.length) {
            this.$el.html(templates.filters(this));
            app.description =  app.description || ['The following includes projects'];

            _(filterModels).each(function(model) {

                view.$('.filter-items').append(templates.filter({ model: model }));
                $('#' + view.collection.id + '-' + model.id).toggleClass('active', model.get('active'));
                if (model.get('active') && !keypress) {
                    $('#breadcrumbs ul').append(
                        '<li><a href="' + BASE_URL + '/#filter/' +
                        view.collection.id + '-' +
                        model.get('id') + '">' +
                        model.get('name').toLowerCase().toTitleCase() +
                        '</a></li>'
                    );

                    if (view.collection.id === 'operating_unit') {
                        $('#applied-filters').removeClass('no-country');
                        app.description.push(' for the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> office');
                    }
                    if (view.collection.id === 'region') {
                        $('#applied-filters.no-country').removeClass('no-region');
                        app.description.push(' in the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong> region');
                    }
                    if (view.collection.id === 'donor_countries') {
                        var mId = model.id;

                        if (mId === 'MULTI_AGY') {
                            app.description.push(' with funding from  <strong>Multi-Lateral Agencies</strong>');
                        } else if (mId === 'OTH') {
                            app.description.push(' with funding from  <strong>Uncategorized Organizations</strong>');
                        } else {
                            app.description.push(' with funding from <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');
                        }
                    }
                    if (view.collection.id === 'donors') {
                        app.description.push(' funded by the <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');
                    }
                    if (view.collection.id === 'focus_area') {
                        app.description.push(' with a focus on <strong>' + model.get('name').toLowerCase().toTitleCase() + '</strong>');
                    }
                }
            });

        } else {
            this.$el.empty();
        }

        $('#chart-' + this.collection.id + '.rows').empty();

        if (chartModels.length <= 1 && this.collection.id !== 'focus_area') {
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

                chartModels = this.collection.models;

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
                        '  <span class="icon icon-thumbnail ' + focusIconClass + '"></span>' +
                        '  <span class="pct"></span><a href="#filter/focus_area-' + model.id + '" class="focus-title">' + focusName + '</a>' +
                        '</li>');

                    $('.fa' + (model.id) + ' .pct').text(value + '%');
                });

                $el.prepend('<h3 id="focus">Focus Areas <span>% of budget</span></h3>');
            } else if (this.collection.id === 'operating_unit' || this.collection.id === 'donors') {

                donor = (_(app.app.filters).find(function(filter) {
                        return filter.collection === 'donors';
                    }) || {id: 0}).id;

                var max = '',
                    view = this,
                    rows = [],
                    newWidth = 1;

                $('#chart-' + this.collection.id + ' .rows').html('');
                _(chartModels).each(function(model) {

                    if (view.collection.id === 'donors') {
                        donor = model.id;

                        var donorProjects = (donor) ? app.projects.chain()
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

                    } else {
                        var donorBudget = (donor) ? app.projects.chain()
                                .filter(function(project) {
                                    return project.get('operating_unit') === model.id;
                                })
                                .reduce(function(memo, project) {
                                    var donorIndex = _(project.get('donors')).indexOf(donor);
                                    if (donorIndex === -1) return memo;
                                    return memo + project.get('donor_budget')[donorIndex];
                                }, 0).value() : 0;
                        var donorExpenditure = (donor) ? app.projects.chain()
                                .filter(function(project) {
                                    return project.get('operating_unit') === model.id;
                                })
                                .reduce(function(memo, project) {
                                    var donorIndex = _(project.get('donors')).indexOf(donor);
                                    if (donorIndex === -1) return memo;
                                    return memo + project.get('donor_expend')[donorIndex];
                                }, 0).value() : 0;
                    }

                    var budget = accounting.formatMoney(
                                ((donor) ? donorBudget : model.get('budget')) / 1000000
                            ) + 'M';

                    var budgetWidth = (donor) ? (donorBudget) : (model.get('budget'));
                    var expenditureWidth = (donor) ? (donorExpenditure) : (model.get('expenditure'));

                    var caption = '<a href="#filter/' + model.collection.id + '-' + model.get('id') +
                        '">' + model.get('name').toLowerCase().toTitleCase() + '</a>';
                    var bar = '<div class="budgetdata" data-budget="' + budgetWidth + '"></div>' + '<div class="subdata" data-expenditure="' + expenditureWidth + '"></div>';

                    rows.push({
                        sort: -1 * ((donor) ? donorBudget : model.get('budget')),
                        content: '<tr>' +
                            '    <td>' + caption + '</td>' +
                            '    <td class="right">' + budget + '</td>' +
                            '    <td class="data">' + bar + '</td>' +
                            '</tr>'
                    });

                });

                rows = _(rows).sortBy('sort');
                max = rows[0].sort * -1;

                _(rows).each(function(row) {
                    $('#chart-' + view.collection.id + ' .rows').append(row.content);
                });
                $('#chart-' + view.collection.id + ' .rows tr').each(function() {
                    $('.data .budgetdata', this).width(($('.data .budgetdata', this).attr('data-budget') / max * 100) + '%');
                    $('.data .subdata', this).width(($('.data .subdata', this).attr('data-expenditure') / max * 100) + '%');
                });

            }
        }

        return this;
    }
});
