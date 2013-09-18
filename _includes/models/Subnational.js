// Model
models.Subnational = Backbone.Model.extend({
    defaults: {visible:false},
    initialize:function(){ // can this happen on a collection level?
        model = this;
        sub = model.get('subnational');
        if (sub.length === 0 ) {
            model.geojson = null;
        } else {
            geojson = [];
            _(sub).each(function(data){
                var feature = {
                    "type":"Feature",
                    "properties":{
                        project:model.get('id'),
                        title:model.get('title'),
                        precision: data.precision,
                        scope: data.scope,
                        type: data.type
                        },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [parseFloat(data.lon),parseFloat(data.lat)]
                        }
                    };
                geojson.push(feature);   
            })
            model.geojson = geojson;
        }
    }
});

// Collection
models.Subnationals = Backbone.Collection.extend({
    model: models.Subnational,
    parse: function(response){
        return response.projects
    },
    filtered: function() {
        visible = this.filter(function(model) {
          return model.get("visible") === true;
        });
        return new models.Subnationals(visible);
    }
});