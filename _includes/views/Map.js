views.Map = Backbone.View.extend({
    events: {
        'click img.mapmarker': 'mapClick',
        'click img.simplestyle-marker': 'mapClick',
        'mouseover img.mapmarker': 'tooltipFlip'
    },

    initialize: function() {
        this.render();

        if (this.collection) {
            this.collection.on('update', this.render, this);
        }
    },

    render: function() {
        app.hdi = false;
        var view = this,
            layer,
            unit = (this.collection) ? this.collection : this.model.get('operating_unit_id');

        // Get HDI data
        $.getJSON('api/hdi.json', function(data) {

            var hdiWorld = _.find(data,function(d){return d.name == 'World';});
            hdiWorld.count = _.max(data,function(d){return d.rank;}).rank;

            var hdiArray = _.reduce(data, function(res, obj) {
                if (((_.isObject(unit)) ? unit.operating_unit[obj.id] : obj.id === unit) && obj.hdi) {
                    res[obj.id] = {
                        hdi: obj.hdi,
                        health: obj.health,
                        education: obj.education,
                        income: obj.income,
                        rank: obj.rank
                    };
                }
                return res;
            }, {});

            if (view.collection) {
                if (!view.options.embed) {
                    layer = $('.map-btn.active').attr('data-value');
                } else {
                    layer = 'budget';
                }
                view.collection.hdi = hdiArray;
                view.collection.hdiWorld = hdiWorld;
                if ($('#operating_unit .filter').hasClass('active') || view.options.embed) {
                    var hdi = _.filter(data, function(d) {
                        return d.id == _.keys(unit.operating_unit);
                    })[0];

                    $('.map-btn[data-value="hdi"] .total-caption').html('HDI');

                    if (hdi && _.size(hdiArray) > 0) {
                        $('#hdi').html(_.last(hdi.hdi)[1]);
                        app.hdi = true;
                        view.hdiChart(hdi,hdiWorld);
                        view.hdiDetails(hdi);
                    } else {
                        $('#hdi').html('no data');
                        $('#chart-hdi').css('display','none');
                    }
                } else {
                    $('#hdi').html(_.last(hdiWorld.hdi)[1]);
                    $('.map-btn[data-value="hdi"] .total-caption').html('HDI Global');
                }
            } else {
                layer = 'budget';
                view.model.set('hdi',hdiArray[unit]);
                view.model.set('hdiWorld',hdiWorld);
            }
        }).success(function() {
                view.$el.empty().append('<div class="inner-shadow"></div>');
                view.buildMap(layer);
        });

        return this;
    },
    mapClick: function(e) {
        var $target = $(e.target),
            drag = false,
            view = this;

        this.map.addCallback('panned', function() {
            drag = true;
        });

        // if map has been panned do not fire click
        $target.on('mouseup', function(e) {
            var path;
            if (drag) {
                e.preventDefault();
            } else {
                if ($target.hasClass('simplestyle-marker')) {
                    path = '#filter/operating_unit-' + view.model.get('operating_unit_id');
                } else {
                    path = '#filter/operating_unit-' + $target.attr('id');
                }
                app.navigate(path, { trigger: true });
                $('#browser .summary').removeClass('off');
            }
        });
    },

    hdiChart: function(country,world) {
        $('#chart-hdi h3').html('Human Development Index');
        $('.data', '#chart-hdi').empty().append(
            '<div class="total" style="width:' + _.last(country.hdi)[1]*100 + '%">' + _.last(country.hdi)[1] + '</div>' +
            '<div class="subdata total" style="width:' + _.last(world.hdi)[1]*100 + '%;"></div>' +
            '<div class="health" style="width:' + _.last(country.health)[1]*100 + '%">' + _.last(country.health)[1] + '</div>' +
            '<div class="subdata health" style="width:' + _.last(world.health)[1]*100 + '%;"></div>' +
            '<div class="education" style="width:' + _.last(country.education)[1]*100 + '%">' + _.last(country.education)[1] + '</div>' +
            '<div class="subdata education" style="width:' + _.last(world.education)[1]*100 + '%;"></div>' +
            '<div class="income" style="width:' + _.last(country.income)[1]*100 + '%">' + _.last(country.income)[1] + '</div>' +
            '<div class="subdata income" style="width:' + _.last(world.income)[1]*100 + '%;"></div>'
        );
        $('#chart-hdi .ranking').html(country.rank + '<span class="outof">/' + world.count + '</span>');
    },

    hdiDetails: function(data) {
        var beginYr = _.first(data.hdi)[0],
            endYr = _.last(data.hdi)[0],
            ctry = data.hdi,
            health = data.health,
            ed = data.education,
            inc = data.income;

        var sparklineOptions = {
            xaxis: {show: false, min: beginYr, max: endYr},
            yaxis: {show: false, min: 0, max: 1},
            grid: { show: true, borderWidth: 0, color: '#CEDEDD', minBorderMargin: 0,
                markings: function (axes) {
                    var markings = [];
                    for (var x = 5; x < axes.xaxis.max; x += 5)
                        markings.push({ xaxis: { from: x, to: x }, lineWidth: 1, color: '#CEDEDD' });
                    for (var y = 0.2; y < axes.yaxis.max; y += 0.2)
                        markings.push({ yaxis: { from: y, to: y }, lineWidth: 1, color: '#CEDEDD' });
                    return markings;
                }
            },
            series: {
                lines: { lineWidth: 1 },
                shadowSize: 0
            },
            colors: ['#96CCE6', '#70B678', '#DC9B75', '#036']
        };

        var points = {points: { show:true, radius: 1 }};

        if (beginYr === endYr) {
            _.extend(sparklineOptions.series, points);
            endYr = '';
        }

        $('#xlabel .beginyear').html(beginYr);
        $('#xlabel .endyear').html(endYr);

        if (data.change > 0) {
            $('#chart-hdi .change').html('<div class="trend hdi-up"></div>' + Math.round(data.change*1000)/1000);
        } else if (data.change < 0) {
            $('#chart-hdi .change').html('<div class="trend hdi-down"></div>' + Math.round(data.change*1000)/1000);
        } else {
            $('#chart-hdi .change').html('<div class="trend hdi-nochange">--</div>' + Math.round(data.change*1000)/1000);
        }

        $.plot($("#sparkline"), [health,ed,inc,{data: ctry, lines: {lineWidth: 1.5}}], sparklineOptions);
    },

    scale: function(cat,x) {
        if (cat == 'budget' || cat == 'expenditure') {
            return Math.round(x.properties[cat] / 100000);
        } else if (cat == 'hdi') {
            return Math.round(Math.pow(x.properties[cat],2) / 0.0008);
        } else {
            return Math.round(x.properties[cat] / 0.05);
        }
    },

    updateMap: function(layer) {
        var view = this,
            markers = this.map.layers[1],

            radii = function(f) {
                f.properties.description = view.tooltip(layer, f.properties);
                return clustr.area_to_radius(
                    Math.round(view.scale(layer,f))
                );
            };

        if (markers) {
            markers.sort(function(a,b){ return b.properties[layer] - a.properties[layer]; })
                .factory(clustr.scale_factory(radii, 'rgba(0,85,170,0.6)', '#FFF'));
        }
    },

    buildMap: function(layer) {
        var view = this,
            locations = [],
            count, sources, budget, title, hdi, hdi_health, hdi_education, hdi_income,
            unit = (this.collection) ? this.collection
                : this.model.get('operating_unit_id'),

            // if unit is an object we're working with the homepage map, else the project map
            homepage = _.isObject(unit);

        view.map = mapbox.map(this.el, null, null, null).setZoomRange(2, 17);
        var mbLayer = mapbox.layer().tilejson(TJ);
        view.map.addLayer(mbLayer);
        view.map.ui.zoomer.add();
        view.map.ui.attribution.add();
        
        $('.map-attribution').html(mbLayer._tilejson.attribution);

        var radii = function(f) {
            f.properties.description = view.tooltip(layer, f.properties);
            return clustr.area_to_radius(
                Math.round(view.scale(layer,f))
            );
        };

        var markers = mapbox.markers.layer();

        if (homepage) {
            markers.factory(clustr.scale_factory(radii, 'rgba(0,85,170,0.6)', '#FFF')).sort(function(a, b) {
                return b.properties[layer] - a.properties[layer];
            });
        }

        $.getJSON('api/operating-unit-index.json', function(data) {
            for (var i = 0; i < data.length; i++) {
                var o = data[i];
                if ((homepage) ? unit.operating_unit[o.id] : o.id === unit) {

                    if (!homepage) {
                        view.getwebData(o);
                        $('#country-summary').html(templates.ctrySummary(o));
                    }

                    if (o.lon) {
                        if (homepage) {
                            count = unit.operating_unit[o.id];
                            sources = unit.operating_unitSources[o.id];
                            budget = unit.operating_unitBudget[o.id];
                            expenditure = unit.operating_unitExpenditure[o.id];
                        } else {
                            count = false;
                            sources = false;
                            budget = view.model.get('budget');
                            expenditure = view.model.get('expenditure');
                        }
                        if ((homepage) ? unit.hdi[o.id] : view.model.get('hdi')) {
                            if (homepage) {
                                hdi = _.last(unit.hdi[o.id].hdi)[1];
                                hdi_health = _.last(unit.hdi[o.id].health)[1];
                                hdi_education = _.last(unit.hdi[o.id].education)[1];
                                hdi_income = _.last(unit.hdi[o.id].income)[1];
                                hdi_rank = unit.hdi[o.id].rank;
                            } else {
                                hdi = _.last(view.model.get('hdi').hdi)[1];
                                hdi_health = _.last(view.model.get('hdi').health)[1];
                                hdi_education = _.last(view.model.get('hdi').education)[1];
                                hdi_income = _.last(view.model.get('hdi').income)[1];
                                hdi_rank = view.model.get('hdi').rank;
                            }
                        } else {
                            hdi = hdi_health = hdi_education = hdi_income = hdi_rank = 'no data';
                        }

                        locations.push({
                            geometry: {
                                coordinates: [
                                    o.lon,
                                    o.lat
                                ]
                            },
                            properties: {
                                id: o.id,
                                project: (homepage) ? '' : view.model.get('project_title'),
                                name: o.name,
                                count: count,
                                sources: sources,
                                budget: budget,
                                expenditure: expenditure,
                                hdi: hdi,
                                hdi_health: hdi_health,
                                hdi_education: hdi_education,
                                hdi_income: hdi_income,
                                hdi_rank: hdi_rank
                            }
                        });

                        if (!homepage) {
                            locations[0].properties['marker-color'] = '#2970B8';
                        }
                    }
                }
            }

            if (locations.length !== 0) {
                markers.features(locations);
                mapbox.markers.interaction(markers);
                view.map.extent(markers.extent());
                view.map.addLayer(markers);
                if (locations.length === 1) {
                    view.map.zoom(4);
                }
            } else {
                view.map.centerzoom({lat:20, lon:0}, 2);
            }
        });
    },

    tooltip: function(layer, data) {
        var description = '<div class="stat">Budget: <span class="value">' +
            accounting.formatMoney(data.budget) + '</span></div>' +
            '<div class="stat">Expenditure: <span class="value">' +
            accounting.formatMoney(data.expenditure) + '</span></div>';

        data.title = data.project + '<div class="subtitle">' + data.name + '</div>';

        // add this if we're counting projects (on homepage)
        if (data.count) {
            description = '<div class="stat">Projects: <span class="value">' +
                 data.count + '</span></div>' +
                 ((data.sources > 1) ? ('<div class="stat">Budget Sources: <span class="value">' +
                 data.sources + '</span></div>') : '') +
                 description +
                 '<div class="stat">HDI: <span class="value">' +
                 data.hdi + '</span></div>';

            data.title = data.name;
        }
        return description;
    },

    tooltipFlip: function(e) {
        var $target = $(e.target),
            top = $target.offset().top - this.$el.offset().top;
        if (top <= 150) {
            var tipSize = $('.marker-popup').height() + 50;
            $('.marker-tooltip')
                .addClass('flip')
                .css('margin-top',tipSize + $target.height());
        }
    },

    getwebData: function(data) {
        var view = this,
            photos = this.model.get('docPhotos') || [],
            baseUrl = '',
            coContact = {
                twitter: [],
                flickr: [],
                facebook: []
            };

        // Get social media accounts from UNDP-maintained spreadsheet
        $.getJSON('//spreadsheets.google.com/feeds/list/0Airl6dsmcbKodHB4SlVfeVRHeWoyWTdKcDY5UW1xaEE/1/public/values?alt=json-in-script&callback=?', function(g) {
            var flickrAccts = [],
                twitterAccts = [],
                fbAccts = [];

            _.each(g.feed.entry, function(row) {
                if (row.gsx$type.$t === 'Global' || (row.gsx$type.$t === 'HQ' && row.gsx$id.$t === view.model.get('region_id'))
                    ) {
                    if (row.gsx$twitter.$t) twitterAccts.push(row.gsx$twitter.$t.replace('@',''));
                    if (row.gsx$flickr.$t) flickrAccts.push(row.gsx$flickr.$t);
                    if (row.gsx$facebook.$t) fbAccts.push(row.gsx$facebook.$t);
                }
                if (row.gsx$type.$t === 'CO' && row.gsx$id.$t === data.id) {
                    if (row.gsx$twitter.$t) {
                        twitterAccts.unshift(row.gsx$twitter.$t.replace('@',''));
                        coContact.twitter.push(row.gsx$twitter.$t.replace('@',''));
                    }
                    if (row.gsx$flickr.$t) {
                        flickrAccts.unshift(row.gsx$flickr.$t);
                        coContact.flickr.push(row.gsx$flickr.$t);
                    }
                    if (row.gsx$facebook.$t) {
                        fbAccts.unshift(row.gsx$facebook.$t);
                        coContact.facebook.push(row.gsx$facebook.$t);
                    }
                }
            });

            view.twitter(twitterAccts, function(twPhotos) {
                view.flickr(flickrAccts,photos.concat(twPhotos));
            });

            contacts(coContact);
        });

        function contacts(social) {
            _.each(['web','email','facebook','twitter','flickr'], function(v) {
                var link = '',
                    i = 0;

                if (data[v] || (social[v] && social[v].length)) {
                    if (v == 'twitter') baseUrl = 'http://twitter.com/';
                    if (v == 'email') baseUrl = 'mailto:';
                    if (v == 'flickr') baseUrl = 'http://flickr.com/photos/';

                    if (social[v]) {
                        _.each(social[v], function(x) {
                            i += 1;
                            link += '<a href="' + baseUrl + social[v] + '">' +
                                    ((v == 'twitter') ? '@' + social[v] : social[v]) + '</a>';
                            if (i < social[v].length) link += ', ';
                        });
                    } else {
                        link += '<a href="' + baseUrl + data[v] + '">' + data[v] + '</a>';
                    }

                    // Fill contact modal
                    $('#unit-contact .modal-body').append(
                        '<div class="row-fluid">' +
                            '<div class="contacts span2">' +
                                '<p>' + ((v == 'web') ? 'Homepage' : v.capitalize()) +'</p>' +
                            '</div>' +
                            '<div class="span10">' +
                                '<p>' + link + '</p>' +
                            '</div>' +
                        '</div>'
                    );
                }
            });
        }
    },

    twitter: function(username, callback) {
        var query = 'from:' + username.join(' OR from:') + ' ' + this.model.get('project_id'),
            twPhotos = [];

        $.getJSON('http://search.twitter.com/search.json?&q=' + encodeURIComponent(query) + '&include_entities=1&callback=?', function(tweets) {
            if (tweets.results.length) {
                $('#twitter-block').show();
                _.each(tweets.results, function(t) {
                    if ((t.entities.media) ? t.entities.media[0].type == 'photo' : t.entities.media) {
                        twPhotos.push({
                            'source': t.entities.media[0].media_url,
                            'date': new Date(t.created_at),
                            'description': t.text,
                            'link': t.entities.media[0].expanded_url,
                            'height': t.entities.media[0].sizes.medium.h,
                            'width': t.entities.media[0].sizes.medium.w
                        });
                    }
                });

                $('.tweet').tweet({
                    tweets: tweets,
                    avatar_size: 40,
                    count: 3,
                    template: "{avatar}<div class='actions'>{time}</div><div>{text}</div>",
                    loading_text: "Loading Tweets"
                });

                $('#twitter-block').find('.fade').addClass('in');
            }

            callback(twPhotos);
        });
    },

    flickr: function(account, photos) {
        var apiBase = 'http://api.flickr.com/services/rest/?format=json&jsoncallback=?&method=',
            apiKey = '1da8476bfea197f692c2334997c10c87', //from UNDP's main account (unitednationsdevelopmentprogramme)
            search = this.model.get('project_id'),
            //search = 'africa' //for testing
            attempt = 0,
            i = 0,
            $el = $('#flickr');

        if (!account.length && photos.length) {
            $el.show();
            loadPhoto(i);
        } else {
            _.each(account, function(acct) {
                // Get user info based on flickr link
                $.getJSON(apiBase + 'flickr.urls.lookupUser&api_key=' + apiKey + '&url=http://www.flickr.com/photos/' + acct, function(f) {
                    searchPhotos(f.user.id, search);
                });
            });
        }

        // Search Flickr based on project ID.
        function searchPhotos(id, tags) {
            attempt += 1;
            $.getJSON(apiBase + 'flickr.photos.search&api_key=' + apiKey + '&user_id=' + id + '&tags=' + tags,
                function(f) {
                    if (f.photos.total != '0') {
                        photos = photos.concat(f.photos.photo);
                    }
                    if (attempt == account.length) {
                        if (photos.length) {
                            $el.show();
                            loadPhoto(i);
                        }
                    }
                }
            );
        }

        // Load single photo from array
        function loadPhoto(x) {
            $el.find('.spin').spin({ color:'#fff' });
            if (x === 0) $('.prev', $el).addClass('inactive');
            if (x === photos.length - 1) $('.next', $el).addClass('inactive');

            if (photos[x].id) {
                var photoid = photos[x].id,
                    source, pHeight, pWidth,
                    attempt = 0;

                // Get photo info based on id
                $.getJSON(apiBase + 'flickr.photos.getInfo&api_key=' + apiKey + '&photo_id=' + photoid, function(info) {

                    var description = info.photo.description._content,
                        date = (new Date(info.photo.dates.taken)).toLocaleDateString(),
                        url = info.photo.urls.url[0]._content;

                    // Get available sizes
                    $.getJSON(apiBase + 'flickr.photos.getSizes&api_key=' + apiKey + '&photo_id=' + photoid, function(s) {

                        getSize('Medium 800');
                        function getSize(sizeName) {
                            _.each(s.sizes.size, function(z) {
                                if (z.label == sizeName) {
                                    source = z.source;
                                    pHeight = z.height;
                                    pWidth = z.width;
                                }
                            });

                            if (!source) {
                                attempt += 1;
                                switch (attempt) {
                                    case 1:
                                        getSize('Medium 640');
                                        break;
                                    case 2:
                                        getSize('Large');
                                        break;
                                    case 3:
                                        getSize('Original');
                                        break;
                                }
                            }
                        }

                        // Fill in date & description
                        $('.meta', $el).html('<div class="meta-inner"><span class="date">' + date + '</span>' +
                            '<p>' + description +
                            '<a href="' + url + 'in/photostream/" title="See our photos on Flickr"> Source</a></p></div>');

                        insertPhoto(pHeight, pWidth, source);
                    });
                });

            } else if (photos[x].date) {
                $('.meta', $el).html('<div class="meta-inner"><span class="date">' + photos[x].date.toLocaleDateString() + '</span>' +
                    '<p>' + photos[x].description +
                    '<a href="' + photos[x].link + '/in/photostream/" title="See our photos on Flickr"> Source</a></p></div>');

                insertPhoto(photos[x].height, photos[x].width, photos[x].source);

            } else {
                insertPhoto(photos[x].image.height, photos[x].image.width, photos[x].source);
                $('.meta-inner', $el).empty();
            }

            function insertPhoto(height, width, src) {
                $el.find('img').attr('src', src).addClass('in');
                $el.find('.spin').spin(false);
            }
        }

        // Cycle through photo array
        $('.next', $el).click(function() {
            if (i === 0) {
                $('.prev', $el).removeClass('inactive');
            }
            i += 1;
            if (i == photos.length - 1) {
                $('.next', $el).addClass('inactive');
            }
            loadPhoto(i);
        });
        $('.prev', $el).click(function() {
            if (i === photos.length - 1) {
                $('.next', $el).removeClass('inactive');
            }
            i -= 1;
            if (i === 0) {
                $('.prev', $el).addClass('inactive');
            }
            loadPhoto(i);
        });

        // Toggle resizing of photo to fit container
        $('.resize', $el).click(function() {
            if ($('body').hasClass('fullscreen')) {
                $('body').removeClass('fullscreen');
                $(this).find('.text').text('Details');
            } else {
                $('body').addClass('fullscreen');
                $(this).find('.text').text('Hide Details');
            }
        });
    }
});
