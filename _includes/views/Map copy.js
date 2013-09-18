views.Map = Backbone.View.extend({
    initialize: function() {
        if (this.options.render) this.render();
    },
    render: function() {
        var view = this;
        if (!IE) view.$el.append('<div class="inner-shadow"></div>');
        view.$el.find('.inner-grey').remove(); // remove 'operating unit has no geo' paragraph

        view.regionFilter =_(app.app.filters).findWhere({collection:"region"});
        view.opUnitFilter =_(app.app.filters).findWhere({collection:"operating_unit"});

        if (!view.options.embed) {
            layer = $('.map-btn.active').attr('data-value') || 'budget';
            // when no operating unit is selected, reset to the global map
            if (layer === 'budget' && _.isUndefined(view.opUnitFilter)){$('.map-btn.budget').addClass('active')};
            wheelZoom = true;
        } else {
            layer = 'budget';
            wheelZoom = false;
        };

        // destroy previous map, same as view.$el.empty() for updating
        if (view.map){view.map.remove()};
        // create the map with mapbox.js 1.3.1
        view.map = L.mapbox.map(this.el,TJ.id,{
            minZoom: TJ.minzoom,
            maxZoom: TJ.maxzoom,
            scrollWheelZoom: wheelZoom
            });//.setView([0,-15],2);

        // create circle or cluster based on the operating unit filter
        if (_.isObject(view.opUnitFilter)){
            view.markers = new L.MarkerClusterGroup({showCoverageOnHover:false});
        } else {
            view.markers = new L.FeatureGroup();
            view.map.setView([0,-15],2);
        };

        //for IE 8 and above add country outline
        if (!IE || IE_VERSION > 8){view.outline = new L.GeoJSON()};

        view.buildLayer(layer);
    },
    // define map center based on region filter
    zoomToRegion: function(region){
        if (region === "RBA"){
            this.map.setView([0,20],3)
        } else if (region === "RBAP"){
            this.map.setView([37,80],2)
        } else if (region === "RBAS" || region === "PAPP"){
            this.map.setView([32,32],3)
        } else if (region === "RBEC"){
            this.map.setView([50,55],3)
        } else if (region === "RBLAC"){
            this.map.setView([-2,-67],2)
        } else if (region === "global"){
            this.map.setView([0,0],2)
        }
    },
    // CIRCLE
    scale: function(cat,feature) {
        if (cat == 'budget' || cat == 'expenditure') {
            return Math.round(feature.properties[cat] / 100000);
        } else if (cat == 'hdi') {
            return Math.round(Math.pow(feature.properties[cat],2) / 0.0008);
        } else {
            return Math.round(feature.properties[cat] / 0.05);
        }
    },
    radius: function(scaleResult){
        var r = Math.round(Math.sqrt(scaleResult/ Math.PI));
        return r
    },
    circleHighlight: function(e,options){
        if (!options){options = {}}
        $target = e.target;
        $target.setStyle({
            color: options.color || '#fff',
            weight: options.weight || 1,
            opacity: options.opacity || 1,
            fillColor: options.fillColor || '#0055aa',
            fillOpacity: options.fillOpacity || 0.6
        })
    },
    circlePopup: function(layer, data) {
        var description = '<div class="title"><b>' + data.properties.title + '</b></div>' +
            '<div class="stat' + ((layer == 'count') ? ' active' : '') + '">Projects: <span class="value">' +
            data.properties.count + '</span></div>' +
            ((data.sources > 1) ? ('<div class="stat' + ((layer == 'sources') ? ' active' : '') + '">Budget Sources: <span class="value">' +
            data.properties.sources + '</span></div>') : '') +
            '<div class="stat' + ((layer == 'budget') ? ' active' : '') + '">Budget: <span class="value">' +
            accounting.formatMoney(data.properties.budget) + '</span></div>' +
            '<div class="stat' + ((layer == 'expenditure') ? ' active' : '') + '">Expenditure: <span class="value">' +
            accounting.formatMoney(data.properties.expenditure) + '</span></div>' +
            '<div class="stat' + ((layer == 'hdi') ? ' active' : '') + '">HDI: <span class="value">' +
            data.properties.hdi + '</span></div>';
        return description;
    },
    // CLUSTER
    clusterPopup: function(data, g) {
        var project = data.project,
            title = data.title,
            type = (g.type[data.type]) ? g.type[data.type].split(':')[0] : 'unknown',
            scope = (g.scope[data.scope]) ? g.scope[data.scope].split(':')[0] : 'unknown',
            precision = (g.precision[data.precision]) ? g.precision[data.precision].split(' ')[0] : 'unknown';

        var description = '<div><b>Project: </b>' + project + '</div>'
                        + '<div><b>Name: </b>' + title + '</div>'
                        + '<div><b>Location type: </b>' + type + '</div>'
                        + '<div><b>Scope: </b>' + scope + '</div>'
                        + '<div><b>Precision: </b>' + precision + '</div>';
        return description;
    },
    goToLink: function(path){
        app.navigate(path, { trigger: true });
        $('#browser .summary').removeClass('off');
    },
    buildLayer: function(layer,mapFilter){
        var view = this;

        view.map.removeLayer(view.markers); //remove the marker featureGroup from view.map
        view.markers.clearLayers(); // inside of marker group, clear the layers from the previous build

        var count, sources, budget, title, hdi, hdi_health, hdi_education, hdi_income,
            unit = view.collection;

        country = new models.Nationals();
        country.fetch({
            url: 'api/operating-unit-index.json',
            success:function(){
                if(_.isObject(view.opUnitFilter)){
                    subs = new models.Subnationals();
                    subs.fetch({
                        url: 'api/units/' + view.opUnitFilter.id + '.json',
                        success:function(){
                            // the projects in subs need to be matched to the unit models
                            // matching subs.models and unit.models on id and set the visible ones
                            _(unit.models).each(function(model){
                                if (subs.get(model.id) != undefined){
                                    subs.get(model.id).set({visible:true})
                                }
                            })
                            filteredSubs = subs.filtered(); //filtered() is a method in the collection
                            renderClusters(filteredSubs);
                        }
                    });

                    // find the iso number from the national models
                    var parent = _(country.models).findWhere({id:view.opUnitFilter.id}),
                        iso = parseInt(parent.get('iso_num'));

                    if (_.isNaN(iso)){
                        view.map.setView([0,-15],2);
                        view.$el.prepend('<div class="inner-grey">'+
                                         '<p>The seleted operating unit and its project(s) do not have associated geography.</p>'+
                                         '</div>');
                    } else {
                        view.map.setView([parent.lat,parent.lon],3); //why is the lat and lon reversed here

                        //draw country outline with the topojson file
                        if (!IE || IE_VERSION > 8){
                            view.outline.clearLayers();
                            $.getJSON('api/world-110m.json',function(world){
                            var topoFeatures = topojson.feature(world, world.objects.countries).features,
                                selectedFeature = _(topoFeatures).findWhere({id:iso});

                                view.outline.addData(selectedFeature
                                    ).setStyle({
                                        "color": "#b5b5b5",
                                        "weight": 3,
                                        clickable: false
                                    });

                                view.outline.addTo(view.map);
                            });
                        }
                    }
                } else {
                    renderCircles(country);
                    console.log('hey');
                    if(_.isObject(view.regionFilter)){
                        view.zoomToRegion(view.regionFilter.id);
                    }
                }
            }
        });

        var renderClusters = function(collection){
            var filteredMarkers = [],
                projectWithNoGeo = 0;
                hasGeo = false;

            _(collection.models).each(function(model){
                if (model.geojson){
                    hasGeo = true;
                    filteredMarkers.push(model.geojson);
                    filteredMarkers = _(filteredMarkers).flatten(false);
                } else {
                    projectWithNoGeo += 1;
                }
            });

            var verbDo = (projectWithNoGeo === 1) ? "does" : "do";
            var verbHave = (projectWithNoGeo === 1) ? "has" : "have";

            // append sub-national location paragraph
            if (projectWithNoGeo != 0 && !hasGeo){
                $('#map-filters').addClass('disabled'); // no sub filter on page
                $('#description p.geography').html("None of these projects have associated geography.");
            } else if (projectWithNoGeo != 0 && hasGeo){
                var projectWithNoGeoParagraph = " <b>" + projectWithNoGeo
                    + "</b> of them " + verbDo + " not " + verbHave + " associated geography; the remaining <b>"
                    + (filteredSubs.length - projectWithNoGeo)
                    + "</b> have <b>"
                    + filteredMarkers.length
                    + "</b> sub-national locations in total."
                $('#description p.geography').html(projectWithNoGeoParagraph);
            }

            // create clustered markers
            $.getJSON('api/subnational-locs-index.json', function(subLocIndex){
                var markerOptions = {
                    'marker-color': '0055aa',
                    'marker-size': 'small'
                    };

                var filteredMarkersLayer = L.geoJson({
                    "type":"FeatureCollection",
                    "features":filteredMarkers
                }, {
                    filter: function(feature, layer, filter) { // only two cases for type, hard code is fine
                        var subFilter = mapFilter || "0";
                        if (subFilter === "0"){
                            return feature.properties
                        } else {
                            return feature.properties['type'] === subFilter
                        }
                    },
                    pointToLayer: function(feature,latlon){
                        return L.marker(latlon,{
                            icon: L.mapbox.marker.icon(markerOptions) // use MapBox style markers
                        })
                    },
                    onEachFeature: function (feature, layer) {
                        var clusterBrief = L.popup({
                                closeButton:false,
                                offset: new L.Point(0,-20)
                            }).setContent(view.clusterPopup(feature.properties, subLocIndex));
                        layer.on('mouseover',function(){
                            clusterBrief.setLatLng(this.getLatLng());
                            view.map.openPopup(clusterBrief);
                        }).on('mouseout',function(){
                            view.map.closePopup(clusterBrief);
                        }).on('click',function(){
                            path = '#project/'+ feature.properties.project;
                            if (!view.options.embed){view.goToLink(path)};
                        });
                    }
                });
                view.markers.addLayer(filteredMarkersLayer);
            });
        };
        var renderCircles = function(){
            _(country.models).each(function(model){
                if (unit.operating_unit[model.id] && model.lon){
                    count = unit.operating_unit[model.id];
                    sources = (unit.donorID) ? false : unit.operating_unitSources[model.id];
                    budget = (unit.donorID && _.size(unit.operating_unit)) ? unit.donorBudget[unit.donorID] : unit.operating_unitBudget[model.id];
                    expenditure = (unit.donorID && _.size(unit.operating_unit)) ? unit.donorExpenditure[unit.donorID] : unit.operating_unitExpenditure[model.id];

                    // Collect HDI data, create HDI graph view if filtered on a single operating_unit
                    if ((HDI[model.id]) ? HDI[model.id].hdi != '' : HDI[model.id]) {
                        hdi = _.last(HDI[model.id].hdi)[1];
                        hdi_health = _.last(HDI[model.id].health)[1];
                        hdi_education = _.last(HDI[model.id].education)[1];
                        hdi_income = _.last(HDI[model.id].income)[1];
                        hdi_rank = HDI[model.id].rank;
                    } else {
                        hdi = hdi_health = hdi_education = hdi_income = hdi_rank = 'no data';
                    }

                    // populate the centroid geojson
                    model.centroid.properties.count = count,
                    model.centroid.properties.sources = sources,
                    model.centroid.properties.budget = budget,
                    model.centroid.properties.expenditure = expenditure,
                    model.centroid.properties.hdi = hdi;

                    var popupContent = view.circlePopup(layer,model.centroid),

                    circleOptions = {
                        radius: view.radius(view.scale(layer,model.centroid)),
                        color:"#fff",
                        weight:1,
                        opacity:1,
                        fillColor: "#0055aa",
                        fillOpacity: 0.6
                    };
                    createCircle(model.centroid,circleOptions,popupContent);
                }
            })
        }
        var createCircle = function(geoJsonFeature,options,hoverPop){
            var brief = L.popup({
                    closeButton:false
                }).setContent(hoverPop);
            var circleLayer = L.geoJson(geoJsonFeature,{
                pointToLayer:function(feature,latlng){
                    return L.circleMarker(latlng,options
                    ).on('mouseover',function(circleMarker){
                        //debugger;
                        brief.setLatLng(latlng);
                        view.map.openPopup(brief);
                        view.circleHighlight(circleMarker,{color:'#0055aa',weight:2});
                    }).on('mouseout',function(circleMarker){
                        view.map.closePopup(brief);
                        view.circleHighlight(circleMarker);
                    }).on('click',function(e){
                        if (app.app.filters.length === 0 ){
                        path = '#filter/operating_unit-' + e.target.feature.properties.id;
                        } else {
                        path = document.location.hash + '/operating_unit-' +  e.target.feature.properties.id;
                        }
                        if (!view.options.embed){view.goToLink(path)};
                    })
                }
            });
            //console.log(JSON.stringify(circleLayer));
            view.markers.addLayer(circleLayer);
        };
        view.map.addLayer(view.markers);
        //console.log('addmarkers');
    }
});
