models.National = Backbone.Model.extend({
    initialize:function(){
        this.lon = this.get('lon');
        this.lat = this.get('lat');
        this.fund_type = this.get('fund_type');
        this.centroid = {
            "type":"Feature",
            "properties":{
                "id":this.get('id'),
                "title":this.get('name')
            },
            "geometry":{
                "type":"Point",
                "coordinates":[parseFloat(this.lon),parseFloat(this.lat)]
            }
        };
    }
});

// Collection
models.Nationals = Backbone.Collection.extend({
    model: models.National
});
