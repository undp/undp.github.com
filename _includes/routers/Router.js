routers.App = Backbone.Router.extend({
    routes: {
        '': 'redirect',
        'filter/*filters': 'redirect',
        ':fiscalyear': 'fiscalyear',
        ':fiscalyear/filter/*filters': 'fiscalyear',
        'project/:id': 'project',
        'project/:id/output-:output': 'project',
        'widget/*options': 'widgetRedirect',
        ':fiscalyear/widget/*options': 'widget',
        'about/*subnav': 'about',
        'top-donors/*cat': 'topDonors'
    },
    
    redirect: function(route) {
        //if url lacks a year, default to most recent
        if (route) {
            this.navigate(CURRENT_YR + '/filter/' + route, {trigger: true});
        } else {
            this.navigate(CURRENT_YR, {trigger: true});
        }
    },
    
    widgetRedirect: function(route) {
        this.navigate(CURRENT_YR + '/widget/' + route, {trigger: true});
    },

    mainApp: function () {
        // Handle feedback form submission
        $('#feedback-form').submit(function (e) {
            // Require 'Feedback' field to have content
            if ($('#entry_2').val() === '') {
                alert('Please fill in the required fields before submitting.');
                return false;
            }
        
            // Set URL for feedback form
            $('#entry_3').val(window.location);

            var button = $('input[type=submit]', this),
                data = $(this).serialize(),
                form = this;

            $.ajax({
                type: 'POST',
                url: 'https://docs.google.com/spreadsheet/formResponse?formkey=dFRTYXNUMWIzbXRhVF94YW9rVmlZNVE6MQ&amp;ifq',
                data: data,
                complete: function () {
                    $('#feedback').modal('hide');
                    $('input[type=text], textarea', form).val('');
                }
            });
            return false;
        });
    },
    
    fiscalyear: function (year, route, embed) {
        var that = this;
        if (!$('#y' + year).length) {
             //passing in year index js (json)
            loadjsFile('api/project_summary_' + year + '.js', year, function() {
                that.browser(year, route, embed);
            });
        } else {
            that.browser(year, route, embed);
        }
    },

    browser: function (year, route, embed) {

        var that = this,
            unit = false;

        if (!embed) {
            // Load in the top donors info and feedbackform dets.
            this.mainApp();
            window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

            // Set up menu
            $('#app .view, #mainnav .profile').hide();
            $('#mainnav li').removeClass('active');
            $('#profile .summary').addClass('off');
            $('#browser, #mainnav .browser').show();
            $('#mainnav li a[href="/"]').parent().addClass('active');
            $('#mainnav li.parent').removeClass('parent-active');

            // Set up breadcrumbs
            $('#breadcrumbs ul').html('<li><a href="http://www.undp.org/content/undp/en/home.html">Home</a></li><li><a href="' + BASE_URL + '">Our Projects</a></li>');

            // Load the main app view
            this.app = this.app || new views.App({
                el: '#browser',
                year: year
            });
        } else {
            this.app = this.app || new views.App({
                el: '#embed',
                embed: embed,
                year: year
            });
        }

        // Save default description
        app.defaultDescription = app.defaultDescription || $('#description p.intro').html();
        
        // Parse hash
        var parts = (route) ? route.split('/') : [];
        var filters = _(parts).map(function (part) {
            var filter = part.split('-');
            if (filter[0] === 'operating_unit') {
                unit = filter[1];
            }
            return {
                collection: filter[0],
                id: filter[1]
            };
        });

        if (_.isEqual(this.app.filters, filters) && app.fiscalYear === year) {
            $('html, body').scrollTop(0);
        } else {
            // slicing the selected facets and getting the json items
            var filter = function (model) {
                if (!filters.length) return true;
                return _(filters).reduce(function (memo, filter) {
                    if (filter.collection === 'region') {
                        return memo && model.get(filter.collection) == filter.id;
                    } else {
                        return memo && (model.get(filter.collection) && model.get(filter.collection).indexOf(filter.id) >= 0);
                    }
                }, true);
            };
            this.app.filters = filters;

            var loadFilters = function() {
                var counter = 0;
                that.app.views = {};
                // Load filters
                _(facets).each(function (facet) {

                    var collection = new models.Filters();
                    $('#filter-items').append('<div id="' + facet.id + '" class="topics"></div>');

                    _(facet).each(function (v, k) {
                        collection[k] = v;
                    });
                   
                    collection.fetch({
                        success: function () {
                            that.app.views[facet.id] = new views.Filters({
                                el: '#' + facet.id,
                                collection: collection
                            });

                            _.each(filters, function (obj) {
                                if (obj.collection === facet.id) {
                                    that.app.views[facet.id].active = true;
                                }
                            });
                            collection.watch();

                            counter++;
                            if (counter === facets.length) updateDescription();

                        }
                    });
                });
                // Create summary map view
                if (!embed){
                    that.projects.map = new views.Map({
                        el: '#homemap',
                        collection: that.projects
                    });
                    that.projects.widget = new views.Widget({
                        context: 'projects'
                    });
                } else {
                    that.projects.map = new views.Map({
                        el: '#homemap',
                        collection: that.projects,
                        embed: embed
                    });
                }
            };

            // Load projects
            if (!this.allProjects || app.fiscalYear != year) {
                if (app.fiscalYear && app.fiscalYear != year){app.projects.map.map.remove();}
                app.fiscalYear = year;
                this.allProjects = new models.Projects(SUMMARY);

                that.projects = new models.Projects(that.allProjects.filter(filter));
                that.projects.view = new views.Projects({ collection: that.projects });
                that.projects.cb = _(loadFilters).bind(that);

                that.projects.watch();
                
                that.app.updateYear(year);

            } else {
                // if projects are already present
                this.projects.cb = updateDescription;
                this.projects.reset(this.allProjects.filter(filter));
            }
            
            updateWhenOpUnit();
        }

        function updateWhenOpUnit(){
            var opUnitFilter =_(app.app.filters).findWhere({collection:"operating_unit"});
            $('.map-filter').removeClass('active') // reset the subfilter look
            $('#map-filters').find('#type-10').addClass('active');
            if(_.isObject(opUnitFilter)){
                $('#map-filters').removeClass('disabled');//shows type sub-filter
                $('.map-btn').removeClass('active');
                $('ul.layers li').addClass('no-hover');
                $('ul.layers li.hdi .graph').addClass('active');
            } else {
                $('#map-filters').addClass('disabled'); //hides type sub-filter
                $('ul.layers li').removeClass('no-hover');
                $('ul.layers li.hdi .graph').removeClass('active');
            }
        }

        function updateDescription() {
            setTimeout(function() {

                // Clear search values on refresh
                $('#filters-search, #projects-search').val('');
    
                if (_(filters).find(function(f) {
                    return f.collection === 'focus_area';
                })) {
                    $('#chart-focus_area').hide();
                } else {
                    $('#chart-focus_area').show();
                }

                // three kinds of descriptions
                // 1. no filter --> defaultDescription
                // 2. filter (no donor) --> start with "The above includes"
                // 3. filter (with donor) --> start with "DONOR funds the above"
                var counts = (app.projects.length === 1) ? 'project' : 'projects';
                    projectCounts = 'There are <strong>' + app.projects.length +'</strong> ' + counts;

                if (app.description && app.description.length === 0){
                    if (app.donorDescription.length > 0) {
                        $('#description p.desc').html(app.donorDescription + counts +' accoss the world.');
                    } else {
                        $('#description p.desc').html(app.defaultDescription);
                    }
                } else if (app.description && app.description.length > 0){
                    if (app.donorDescription.length > 0) {
                        $('#description p.desc').html(app.donorDescription + counts + ' ' + app.description.join(',') + '.');
                    } else {
                        $('#description p.desc').html(projectCounts + app.description.join(',') + '.');
                    }
                } else if (!app.description) {
                    $('#description p.desc').html(app.defaultDescription);
                }

                // reset description
                app.description = false;
                app.donorDescription = "";

                $('#browser .summary').removeClass('off');

                // defaultDescription is already populated
                $('#description p.intro').empty();

                // empty the sub loc content since
                // on a DOM level since it is generated with the page/map
                // instead of beforehdand
                $('#description p.geography').empty();

            }, 0);
        }
        
        // Show proper HDI data
        if (unit && ((HDI[unit]) ? HDI[unit].hdi != '' : HDI[unit])) {
            app.hdi = new views.HDI({
                unit: unit
            });
            if ($('.map-btn[data-value="hdi"]').hasClass('active')) {
                $('#chart-hdi').css('display','block');
            }
        } else {
            app.hdi = false;
            $('#chart-hdi').css('display','none');
            $('ul.layers li.no-hover.hdi a').css('cursor','default');
            $('ul.layers li.hdi .graph').removeClass('active');
            if (unit) {
                $('#hdi').html('no data');
                $('.map-btn[data-value="hdi"] .total-caption').html('HDI');
            } else {
                $('#hdi').html(_.last(HDI['A-000'].hdi)[1]);
                $('.map-btn[data-value="hdi"] .total-caption').html('HDI Global');
            }
        }
        
    },

    project: function (id, output, embed) {
        var that = this;

        if (!embed) {
            // Load in feedbackform dets.
            this.mainApp();

            window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

            // Set up menu
            $('#app .view, #mainnav .browser').hide();
            $('#mainnav li').removeClass('active');
            $('#mainnav .profile').show();
            $('#mainnav li a[href="/"]').parent().addClass('active');
            $('#mainnav li.parent').removeClass('parent-active');
        }

        // Set up this route
        this.project.model = new models.Project({
            id: id
        });

        this.project.model.fetch({
            success: function () {
                if (that.project.view) that.project.view.undelegateEvents();
                that.project.view = new views.ProjectProfile({
                    el: (embed) ? '#embed' : '#profile',
                    model: that.project.model,
                    embed: embed || false,
                    gotoOutput: (output) ? output : false
                });

                if (!embed) {
                    that.project.widget = new views.Widget({
                        context: 'project'
                    });
                }
            }
        });
    },

    widget: function (year, route) {
        var that = this,
            parts = route.split('?'),
            options = parts[1],
            path = parts[0];

        path = (path) ? path.split('/') : [];
        options = (options) ? options.split('&') : [];

        if (path[0] === 'project') {
            that.project(parts[0].split('/')[1], false, options);
        } else {
            var route = parts[0];
            if (route === '') route = undefined;
            that.fiscalyear(year, route, options);
        }
    },

    about: function (route) {
        window.setTimeout(function () {
            $('html, body').scrollTop(0);
        }, 0);

        $('#breadcrumbs ul').html('<li><a href="http://www.undp.org/content/undp/en/home.html">Home</a></li>' + '<li><a href="' + BASE_URL + '">Our Projects</a></li>' + '<li><a href="#about/' + route + '">About: ' + route.capitalize().replace('info','') + '</a></li>');

        $('#app .view, #about .section, #mainnav .profile').hide();
        $('#aboutnav li, #mainnav li').removeClass('active');

        $('#about, #mainnav .browser').show();
        $('#aboutnav li a[href="#about/' + route + '"]').parent().addClass('active');
        $('#about #' + route).show();
        $('#mainnav li.parent').addClass('parent-active');
    },

    topDonors: function (route) {
        var that = this;

        $('#breadcrumbs ul').html('<li><a href="http://www.undp.org/content/undp/en/home.html">Home</a></li>' + '<li><a href="' + BASE_URL + '">Our Projects</a></li>' + '<li><a href="#top-donors/regular">Top Donors</a></li>');

        $('#app .view').hide();
        $('#mainnav li').removeClass('active');
        $('#mainnav li.parent').removeClass('parent-active');

        $('#top-donors').show();
        $('#mainnav li a[href="#top-donors/regular"]').parent().addClass('active');
        
        $('#donor-nav li a').removeClass('active');
        $('#donor-nav li a[href="#top-donors/' + route + '"]').addClass('active');
        
        if (!that.donorsGross) {
            that.donorsGross = new models.TopDonors({type: route});
            that.donorsGross.url = 'api/top-donor-gross-index.json';
    
            that.donorsLocal = new models.TopDonors({type: 'amount'});
            that.donorsLocal.url = 'api/top-donor-local-index.json';
            
            that.donorsGross.fetch({
                success: function () {
                    that.topDonorsGross = new views.TopDonors({
                        el: '.donor-gross-table',
                        collection: that.donorsGross
                    });
                }
            });
            this.donorsLocal.fetch({
                success: function () {
                    that.topDonorsLocal = new views.TopDonors({
                        el: '.donor-local-table',
                        collection: that.donorsLocal
                    });
                }
            });
            
            window.setTimeout(function () {
                $('html, body').scrollTop(0);
            }, 0);
            
        } else {
            that.topDonorsGross.update(route);
        }
    }
});
