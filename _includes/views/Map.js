views.Map = Backbone.View.extend({
    initialize: function() {
        if (this.options.render) this.render();
    },
    render: function() {
        var view = this,
            wheelZoom = true,
            category;
        if (view.map){view.map.remove();} // remove previous map, same concept as view.$el.empty() for updating, http://leafletjs.com/reference.html#map-remove
        view.$el.empty();
        if (IE) {
            view.$el.css('border','1px solid #ddd');
        } else {
            view.$el.append('<div class="inner-shadow"></div>');
        }
        view.$el.find('.inner-grey').remove(); // remove 'operating unit has no geo' paragraph

        view.regionFilter =_(app.app.filters).findWhere({collection:"region"});
        view.opUnitFilter =_(app.app.filters).findWhere({collection:"operating_unit"});

        if (!view.options.embed) {
            category = $('.map-btn.active').attr('data-value') || 'budget';
            // when no operating unit is selected, reset to the global map
            if (category === 'budget' && _.isUndefined(view.opUnitFilter)){$('.map-btn.budget').addClass('active')};
        } else {
            category = 'budget';
            wheelZoom = false;
        };
        
        // create circle or cluster based on the operating unit filter
        if (_.isObject(view.opUnitFilter)){
            view.markers = new L.MarkerClusterGroup({showCoverageOnHover:false});
            var maxZoom = 10;
        } else {
            view.markers = new L.LayerGroup();
        };

        // create the map with mapbox.js 1.3.1
        view.map = L.mapbox.map(this.el,TJ.id,{
            center: [0,-15],
            zoom: 2,
            minZoom: TJ.minzoom,
            maxZoom: maxZoom || TJ.maxzoom,
            scrollWheelZoom: wheelZoom
            });

        //for IE 8 and above add country outline
        if (!IE || IE_VERSION > 8){view.outline = new L.GeoJSON()};

        view.buildLayer(category);
    },
    // define map center based on region filter
    zoomToRegion: function(region){
        if (region === "RBA"){
            this.map.setView([0,20],3,{reset:true});
        } else if (region === "RBAP"){
            this.map.setView([37,80],2,{reset:true});
        } else if (region === "RBAS" || region === "PAPP"){
            this.map.setView([32,32],3,{reset:true});
        } else if (region === "RBEC"){
            this.map.setView([50,55],3,{reset:true});
        } else if (region === "RBLAC"){
            this.map.setView([-2,-67],2,{reset:true});
        } else if (region === "global"){
            this.map.setView([0,0],2,{reset:true});
        }
    },
    // CIRCLE
    scale: function(cat,feature) {
        if (cat == 'budget' || cat == 'expenditure') {
            var size = Math.round(feature.properties[cat] / 100000);
            if (size < 10) {
                return 10;
            } else {
                return size;
            }
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
    circlePopup: function(cat,feature) {
        var description = '<div class="title"><b>' + feature.properties.title + '</b></div>' +
            '<div class="stat' + ((cat == 'count') ? ' active' : '') + '">Projects: <span class="value">' +
            feature.properties.count + '</span></div>' +
            ((feature.sources > 1) ? ('<div class="stat' + ((cat == 'sources') ? ' active' : '') + '">Budget Sources: <span class="value">' +
            feature.properties.sources + '</span></div>') : '') +
            '<div class="stat' + ((cat == 'budget') ? ' active' : '') + '">Budget: <span class="value">' +
            accounting.formatMoney(feature.properties.budget) + '</span></div>' +
            '<div class="stat' + ((cat == 'expenditure') ? ' active' : '') + '">Expenditure: <span class="value">' +
            accounting.formatMoney(feature.properties.expenditure) + '</span></div>' +
            '<div class="stat' + ((cat == 'hdi') ? ' active' : '') + '">HDI: <span class="value">' +
            feature.properties.hdi + '</span></div>';
        return description;
    },
    // CLUSTER
    clusterPopup: function(feature, g) {
        var project = feature.properties.project,
            title = feature.properties.title,
            type = g.type[feature.properties.type],
            // scope = (g.scope[feature.properties.scope]) ? g.scope[feature.properties.scope].split(':')[0] : 'unknown',
            precision = g.precision[feature.properties.precision];

        var description = '<div><b>Project: </b>' + project + '</div>'
                        + '<div><b>Name: </b>' + title + '</div>'
                        + '<div><b>Location type: </b>' + type + '</div>'
                        // + '<div><b>Scope: </b>' + scope + '</div>'
                        + '<div><b>Precision: </b>' + precision + '</div>';
        return description;
    },
    goToLink: function(path){
        app.navigate(path, { trigger: true });
        $('#browser .summary').removeClass('off');
    },
    buildLayer: function(layer,mapFilter,mapCenter,mapZoom){
        var view = this;
        view.map.removeLayer(view.markers); //remove the marker featureGroup from view.map
        view.markers.clearLayers(); // inside of marker group, clear the layers from the previous build

        var count, sources, budget, title, hdi, hdi_health, hdi_education, hdi_income,
            unit = view.collection;

        var country = new models.Nationals();
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

                    if (_.isNaN(iso) && parent.get('id') != 'none'){
                        view.$el.prepend('<div class="inner-grey">'+
                                         '<p>The selected operating unit and its project(s) do not have geographic information.</p>'+
                                         '</div>');
                    } else {
                        //view.map.setView([parent.lat,parent.lon],zoomToCountry(parent.id,5));

                        //draw country outline with the topojson file
                        if (!IE || IE_VERSION > 8){
                            view.outline.clearLayers();
                            $.getJSON('api/world-50m-s.json',function(world){
                            var topoFeatures = topojson.feature(world, world.objects.countries).features,
                                selectedFeature = _(topoFeatures).findWhere({id:iso}),
                                coords = selectedFeature.geometry.coordinates;
                            view.outline.addData(selectedFeature)
                                .setStyle({
                                    "color": "#b5b5b5",
                                    "weight": 3,
                                    clickable: false
                                });
                                
                                if (parent.get('id') === 'RUS') {
                                    view.map.setView([parent.lat,parent.lon],2);
                                } else {
                                    view.map.fitBounds(ctyBounds(coords));
                                }
                                
                                view.outline.addTo(view.map);
                            });
                        } else {
                            view.map.setView([parent.lat,parent.lon],4);
                        }
                    }
                } else {
                    renderCircles(country);
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
                $('#description p.geography').html("None of these projects have geographic information.");
            } else if (projectWithNoGeo != 0 && hasGeo){
                var projectWithNoGeoParagraph = " <b>" + projectWithNoGeo
                    + "</b> of them " + verbDo + " not " + verbHave + " geographic information; the remaining <b>"
                    + (filteredSubs.length - projectWithNoGeo)
                    + "</b> have <b>"
                    + filteredMarkers.length
                    + "</b> subnational locations in total."
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
                        var subFilter = mapFilter || "10";
                        if (subFilter === "10"){
                            return feature.properties
                        } else {
                            return feature.properties['precision'] === subFilter
                            
                        }
                    },
                    pointToLayer: function(feature,latlng){
                        return L.marker(latlng,{
                            icon: L.mapbox.marker.icon(markerOptions) // use MapBox style markers
                        })
                    },
                    onEachFeature: function (feature, layer) {
                        var clusterBrief = L.popup({
                                closeButton:false,
                                offset: new L.Point(0,-20)
                            }).setContent(view.clusterPopup(feature, subLocIndex));
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
                view.map.addLayer(view.markers);
            });
        };
        var renderCircles = function(){
            var circles = [];
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
                    model.centroid.properties.count = count;
                    model.centroid.properties.sources = sources;
                    model.centroid.properties.budget = budget;
                    model.centroid.properties.expenditure = expenditure;
                    model.centroid.properties.hdi = hdi;
                    model.centroid.properties.popup = view.circlePopup(layer,model.centroid);
                    model.centroid.properties.radius = view.radius(view.scale(layer,model.centroid));

                    circles.push(model.centroid);
                }
            });
            var defaultCircle = {
                color:"#fff",
                weight:1,
                opacity:1,
                fillColor: "#0055aa",
                fillOpacity: 0.6
            };
            var circleLayer = L.geoJson({
                "type":"FeatureCollection",
                "features":_(circles).sortBy(function(f) { return -f.properties[layer]; })
            },{
                pointToLayer:function(feature,latlng){
                    return L.circleMarker(latlng,defaultCircle).setRadius(feature.properties.radius);
                },
                onEachFeature:function(feature, layer){
                    var brief = L.popup({
                            closeButton:false,
                            offset:[0, -feature.properties.radius+5]
                        }).setContent(feature.properties.popup);
                    layer.on('mouseover',function(e){
                        brief.setLatLng(this.getLatLng());
                        view.map.openPopup(brief);
                        view.circleHighlight(e,{color:'#0055aa',weight:2});
                    }).on('mouseout',function(e){
                        view.map.closePopup(brief);
                        view.circleHighlight(e);
                    }).on('click',function(e){
                        if (app.app.filters.length === 0 ){
                            path = document.location.hash + '/filter/operating_unit-' + e.target.feature.properties.id;
                        } else {
                            path = document.location.hash + '/operating_unit-' +  e.target.feature.properties.id;
                        }
                        if (!view.options.embed){view.goToLink(path)};
                    })
                }
            });
            view.markers.addLayer(circleLayer);
            view.map.addLayer(view.markers);
        }
    }
});
