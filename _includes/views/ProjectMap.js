views.ProjectMap = Backbone.View.extend({
    events: {
        'click .map-fullscreen': 'fullscreen',
        'mouseover img.simplestyle-marker': 'tooltipFlip'
    },

    initialize: function() {
        if (this.options.render) this.render();
    },
  
    render: function() {
        var view = this,
            locations = [],
            count, sources, budget, title, hdi, hdi_health, hdi_education, hdi_income,
            unit = this.model.get('operating_unit_id'),
            subLocations = this.model.get('subnational');

        view.map = mapbox.map(this.el, null, null, null).setZoomRange(2, 17);
        var mbLayer = mapbox.layer().tilejson(TJ);
        view.map.addLayer(mbLayer);
        view.map.ui.zoomer.add();
        view.map.ui.attribution.add();
        
        $('.map-attribution').html(mbLayer._tilejson.attribution);
        $(view.el).append('<a href="#" class="map-fullscreen"></a>');

        var markers = mapbox.markers.layer();

        $.getJSON('api/operating-unit-index.json', function(data) {
            for (var i = 0; i < data.length; i++) {
                var o = data[i];
                if (o.id === unit) {
                
                    view.getwebData(o);
                    $('#country-summary').html(templates.ctrySummary(o));

                    if (subLocations.length <= 0) { 
                        if (o.lon) {
                            locations.push({
                                geometry: {
                                    coordinates: [
                                        o.lon,
                                        o.lat
                                    ]
                                },
                                properties: {
                                    id: o.id,
                                    project: view.model.get('project_title'),
                                    name: o.name
                                }
                            });

                            locations[0].properties['marker-color'] = '#2970B8';
                        }
                        createMarkers(locations);
                    } else {
                        $.getJSON('api/subnational-locs-index.json', function(g) {
                        
                            var count = 0;
                            _.each(subLocations, function (o) {
                                locations.push({
                                    geometry: {
                                        coordinates: [
                                            o.lon,
                                            o.lat
                                        ]
                                    },
                                    properties: {
                                        id: o.awardID,
                                        precision: o.precision,
                                        type: o.type,
                                        scope: o.scope,
                                        project: view.model.get('project_title'),
                                        name: o.name,
                                        description: view.tooltip(o, g),
                                        'marker-size': 'small'
                                    } 
                                });
                               
                                if (o.type == 1){locations[count].properties['marker-color'] = '#049FD9';}
                                else if (o.type == 2){locations[count].properties['marker-color'] = '#DD4B39';}
                                count += 1;
                            });
                         createMarkers(locations);
                        });
                    }
                }
            }

            function createMarkers(x) {
                if (x.length !== 0) {
                    markers.features(x);
                    mapbox.markers.interaction(markers);
                    view.map.extent(markers.extent());
                    view.map.addLayer(markers);
                    if (x.length === 1) {
                        view.map.zoom(4);
                    }
                } else {
                    view.map.centerzoom({lat:20, lon:0}, 2);
                }
            }
        });
    },

    fullscreen: function(e) {
        e.preventDefault();

        this.$el.toggleClass('full');
        $('.country-profile').toggleClass('full');
        
        if (this.$el.hasClass('full')) {
            this.map.setSize({ x: 540, y: 338 });
        } else {
            this.map.setSize({ x: 218, y: 200 });
        }
    },

    tooltip: function(data, g) {
        var scope = (g.scope[data.scope]) ? g.scope[data.scope].split(':')[0] : 'unknown',
            type = (g.type[data.type]) ? g.type[data.type].split(':')[0] : 'unknown',
            precision = (g.precision[data.precision]) ? g.precision[data.precision].split(' ')[0] : 'unknown';

        var description = '<div><b>Location type:</b> <span class="value">' + type + '</span></div>'
                        + '<div><b>Scope:</b> <span class="value">' + scope + '</span></div>'
                        + '<div><b>Precision:</b> <span class="value">' + precision + '</span></div>';
       
        return description;
    },

    getwebData: function(data) {
        var view = this,
            photos = [],
            baseUrl = '',
            coContact = {
                twitter: [],
                flickr: [],
                facebook: []
            };

        // Get social media accounts from UNDP-maintained spreadsheet
        $.getJSON('//spreadsheets.google.com/feeds/list/0Airl6dsmcbKodHB4SlVfeVRHeWoyWTdKcDY5UW1xaEE/1/public/values?alt=json-in-script&callback=?', function(g) {
            var flickrAccts = [],
                twitterAcct,
                fbAccts = [],
                q = queue(1);

            q.defer(function(cb) {
                _.each(g.feed.entry, function(row) {
                    if (row.gsx$type.$t === 'Global' || (row.gsx$type.$t === 'HQ' && row.gsx$id.$t === view.model.get('region_id'))
                        ) {
                        //if (row.gsx$twitter.$t) twitterAccts.push(row.gsx$twitter.$t.replace('@',''));
                        if (row.gsx$flickr.$t) flickrAccts.push(row.gsx$flickr.$t);
                        if (row.gsx$facebook.$t) fbAccts.push(row.gsx$facebook.$t);
                    }
                    if (row.gsx$type.$t === 'CO' && row.gsx$id.$t === data.id) {
                        if (row.gsx$twitter.$t) {
                            twitterAcct = row.gsx$twitter.$t.replace('@','');
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
                
                contacts(coContact);
                cb();
            });
            
            // Gather photos from documents, twitter, and flickr, in that order
            q.defer(function(cb) {
                if (that.model.get('document_name')) {
                    _.each(that.model.get('document_name')[0], function (photo, i) {
                        var filetype = photo.split('.')[1].toLowerCase(),
                            source = that.model.get('document_name')[1][i];
                            
                        if (filetype === 'jpg' || filetype === 'jpeg' || filetype === 'png' || filetype === 'gif') {
                            var img = new Image();
                            photos.push({
                                'title': photo.split('.')[0],
                                'source': source,
                                'image': img
                            });
                            
                            img.src = source;
                        }
                    });
                }
                
                cb();
            });
            
            q.await(function() {
               view.twitter(twitterAcct, function(tweets, twPhotos) {
                    view.showTweets(tweets);
                    view.flickr(flickrAccts,photos.concat(twPhotos));
                });
            });
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
        var id = this.model.get('project_id'),
            goodTweets = [],
            twPhotos = [],
            twPage = 1;
            
        getTweets(twPage);
            
        function filterTweets(t) {
            if (t.length) {
                var i = 0;
                _.each(t, function(x) {
                    i++;
                    if (x.entities.urls.length) {
                        _(x.entities.urls).each(function(url) {
                            if (url.expanded_url.indexOf(id) !== -1) {
                                if ((x.entities.media) ? x.entities.media[0].type == 'photo' : x.entities.media) {
                                    twPhotos.push({
                                        'source': x.entities.media[0].media_url,
                                        'date': new Date(x.created_at),
                                        'description': x.text,
                                        'link': x.entities.media[0].expanded_url,
                                        'height': x.entities.media[0].sizes.medium.h,
                                        'width': x.entities.media[0].sizes.medium.w
                                    });
                                }
                                
                                goodTweets.push(x);
                                return;
                            }
                        });
                        
                    }
                    if (goodTweets.length === 3) {
                        callback(goodTweets, twPhotos);
                    } else if (i == t.length) {
                        if (twPage < 4) {
                            twPage++;
                            getTweets(twPage);
                        } else {
                            callback(goodTweets, twPhotos);
                        }
                    }
                });
            } else {
                callback(goodTweets, twPhotos);
            }
        }
        
        function getTweets(page) {
            var success = false;
            $.getJSON('http://api.twitter.com/1/lists/statuses.json?slug=undp-tweets&owner_screen_name=openundp&include_entities=1&include_rts=0&since_id=274016103305461762&per_page=200&page=' + page + '&callback=?', function(globalTweets) {
                success = true;
                if (username) {
                    $.getJSON('http://api.twitter.com/1/user_timeline.json?screen_name=' + username + '&include_entities=1&include_rts=0&since_id=274016103305461762&count=200&page=' + page + '&callback=?', function(coTweets) {
                        filterTweets(coTweets.concat(globalTweets));
                    });
                } else {
                    filterTweets(globalTweets);
                }
            });
            setTimeout(function() {
                if (!success)
                {
                    callback([], []);
                }
            }, 3000);
        }
    },
    
    showTweets: function(tweets) {
        if (tweets.length) {
            $('#twitter-block').show();
            
            $('.tweet').tweet({
                tweets: tweets,
                avatar_size: 40,
                count: 3,
                template: "{avatar}<div class='actions'>{time}</div><div>{text}</div>",
                loading_text: "Loading Tweets"
            });

            $('#twitter-block').find('.fade').addClass('in');
        }
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
            if (!$('.next', $el).hasClass('inactive')) {
                if (i === 0) {
                    $('.prev', $el).removeClass('inactive');
                }
                i += 1;
                if (i == photos.length - 1) {
                    $('.next', $el).addClass('inactive');
                }
                loadPhoto(i);
            }
        });
        $('.prev', $el).click(function() {
            if (!$('.prev', $el).hasClass('inactive')) {
                if (i === photos.length - 1) {
                    $('.next', $el).removeClass('inactive');
                }
                i -= 1;
                if (i === 0) {
                    $('.prev', $el).addClass('inactive');
                }
                loadPhoto(i);
            }
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
    },

    tooltipFlip: function(e) {
        var $target = $(e.target),
            top = $target.offset().top - this.$el.offset().top;
        if (top <= 70) {
            var tipSize = $('.marker-popup').height() + 15;
            $('.marker-tooltip')
                .addClass('flip')
                .css('margin-top',tipSize + $target.height());
        }
    }
});