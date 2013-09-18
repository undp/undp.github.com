views.TopDonors = Backbone.View.extend({
    initialize: function () {
        this.$el.html(templates.topDonors(this));
        this.render();
    },
    render: function () {
        var that = this,
            cat = that.collection.type,
            chartModels = that.collection.models,
            max = chartModels[0].get(cat);
        _(chartModels).each(function(model) {
            if (model.get(cat) != '') {
                $('tbody', that.el).append(templates.topDonor({
                    name: model.get('name'),
                    id: model.get('donor_id'),
                    country: model.get('country'),
                    number: model.get(cat),
                    barWidth: model.get(cat)/max*100
                }));
            }
        });
    },
    update: function(cat) {
        var that = this;
        
        that.collection.comparator = function(model) {
            return -1 * model.get(cat);
        };
        that.collection.sort();
        
        var max = that.collection.models[0].get(cat);
        
        $('tbody', that.el).empty();
        _(that.collection.models).each(function(model) {
            if (model.get(cat) != '') {
                $('tbody', that.el).append(templates.topDonor({
                    name: model.get('name'),
                    id: model.get('donor_id'),
                    country: model.get('country'),
                    number: model.get(cat),
                    barWidth: model.get(cat)/max*100
                }));
            }
        });
    }
});