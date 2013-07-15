views.App = Backbone.View.extend({
    events: {
        'click a.filter': 'setFilter',
        'keyup #filters-search': 'searchFilter',
        'click #filters .label': 'toggleFilter',
        'click #filters .reset': 'clearFilter',
        'click #projects-tab .reset': 'clearSearch',
        'click .map-btn': 'mapLayerswitch',
        'click .widget-config': 'requestIframe',
        'submit .form-search': 'submitForm',
        'click .nav-tabs a': 'tabSwitch',
        'click #yearselect .dropdown-menu a': 'yearChange'
    },
    
    initialize: function(options) {
        var view = this;

        // Toggle country selector
        $(window).on('click', '#country-selector', _(this.showCountries).bind(this));
        $(window).on('click', '#country-list .close', _(this.hideCountries).bind(this));

        this.render();

        if (!this.options.embed) {
            // Filters follow scrolling
            var top = $('#siderail').offset().top - 12;
            $(window).on('scroll', function () {
                var y = $(this).scrollTop();
                if (y >= top) {
                    $('#siderail').addClass('fixed');
                } else {
                    $('#siderail').removeClass('fixed');
                }
            });
        }
    },

    render: function() {

        if (this.options.embed) {
            this.$el.empty().append(templates.embedProjects());
            // Depending on the options passed into the array add a fade
            // in class to all elements containing a data-iotion attribute
            if (this.options.embed) {
                _(this.options.embed).each(function (o) {
                    $('[data-option="' + o + '"]').show();
                });
            }

        } else {
            this.$el.empty().append(templates.app({
                base: BASE_URL,
                year: this.options.year
            }));
        }

        return this;
    },

    setFilter: function(e) {
        var $target = $(e.target),
            path = '',
            parts = ($target.attr('id')) ? $target.attr('id').split('-') : '',
            filters = [{
                collection: parts[0],
                id: parts[1]
            }],
            year = app.fiscalYear;
            shift = false;

        this.clearFilter(e);

        _(this.filters).each(function(filter) {
            if (_.isEqual(filter, filters[0])) {
                shift = true;
            } else if (filter.collection !== filters[0].collection) {
                filters.push(filter);
            }
        });

        if (shift) filters.shift();

        filters = _(filters).chain()
            .compact()
            .map(function(filter) {
                return filter.collection + '-' + filter.id;
            })
            .value().join('/');

        path = (filters.length) ? year + '/filter/' + filters : year;

        e.preventDefault();

        // Close the state of menu items before
        // we navigate and set things up again.
        $('.topics').toggleClass('active', false);
        $('.topics a').toggleClass('active', false);
        $('.topics').toggleClass('filtered', false);

        $('#all-projects').attr('href', '#' + path);
        app.navigate(path, { trigger: true });
    },

    searchFilter: function(e) {
        var $target = $(e.target),
                val = $target.val().toLowerCase();

        $target.parent().find('.reset').toggleClass('hidden', (val === ''));

        _(this.views).each(function(view) {
            view.collection.each(function(model) {
                var name = model.get('name').toLowerCase();

                if (val === '' || name.indexOf(val) >= 0) {
                    model.set('visible', true);
                } else {
                    model.set('visible', false);
                }
            });

            view.render(true);
        });

        // Open all filter facets on search
        if (val === '') {
            $('.topics').toggleClass('active', false);
        } else {
            $('.topics').toggleClass('active', true);
        }
    },

    clearFilter: function(e) {
        e.preventDefault();
        $(e.target).parent().find('input').val('');
        this.searchFilter(e);
        return false;
    },

    clearSearch: function(e) {
        var view = this;
        e.preventDefault();
        $(e.target).parent().find('input').val('');
        app.projects.view.search(e);
    },

    toggleFilter: function (e) {
        var $target = $(e.target),
            cat = $target.attr('data-category'),
            $parent = $('#' + cat);

        e.preventDefault();

        // Bail on the this function if the user has selected
        // a label that has an active filtered selection.
        if ($parent.hasClass('filtered')) return false;

        if ($parent.hasClass('active')) {
            $parent.toggleClass('active', false);
            if (this.views[cat]) {
                this.views[cat].active = false;
            }
        } else {
            $('.topics').each(function () {
                // Loop through all the filtered menus
                // to close active menus providing they don't
                // have an active filtered selection.
                if (!$(this).hasClass('filtered')) {
                    $(this).toggleClass('active', false);
                }
            });
            $parent.toggleClass('active', true);
            if (this.views[cat]) {
                this.views[cat].active = true;
            }
        }
        return false;
    },

    mapLayerswitch: function(e) {
        e.preventDefault();
        $('#chart-hdi').css('display','none');
        var $target = $(e.currentTarget);
        $('.map-btn').removeClass('active');
        $target.addClass('active');
        app.projects.map.updateMap($target.attr('data-value'));

        if ($target.attr('data-value') === 'hdi' && app.hdi) {
            $('#chart-hdi').css('display','block');
        }

        return false;
    },

    requestIframe: function() {
        var context = $('#widget');

        // Reset things each time the widget
        // is requested to the page.
        widgetOpts = []
        $('.widget-preview', context).html('<h3 class="empty">To use this widget choose some options on the left.</h3>');
        $('.widget-code', context).hide();
        $('.widget-options a', context).removeClass('active');
    },

    submitForm: function(e) {
        return false;
    },

    showCountries: function(e) {
        e.preventDefault();
        $('#country-list').css('display', 'block');
    },

    hideCountries: function(e) {
        e.preventDefault();
        $('#country-list').css('display', 'none');
    },
    
    tabSwitch: function(e) {
        if ($(e.target).attr('href') === '#summary-tab') {
            app.projects.map.map.requestRedraw();
        }
    },
    
    yearChange: function(e) {
        e.preventDefault();
        var year = $(e.target).attr('data-value');
        if (year != app.fiscalYear) {
            var filters = _(this.filters).chain()
                .compact()
                .map(function(filter) {
                    return filter.collection + '-' + filter.id;
                })
                .value().join('/');

            var path = (filters.length) ? year + '/filter/' + filters : year;
            
            app.navigate(path, { trigger: true });
        }
    },
    
    updateYear: function(year) {
        $('#total-budget').next('span').html(year + ' Budget');
        $('#total-expenditure').next('span').html(year + ' Expenditure');
        $('#yearselect .dropdown-toggle').html(year + ' <b class="caret"></b>');
    }
});
