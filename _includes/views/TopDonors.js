views.TopDonors = Backbone.View.extend({
    initialize: function () {
        this.$el.html(templates.topDonors(this));
        this.render();
    },
    render: function () {
        var that = this;
            chartModels = that.collection.models;
            max = chartModels[0].get('amount');
            
        _(chartModels).each(function(model) {
            $('tbody', that.el).append(templates.topDonor({ model: model, barWidth: model.get('amount')/max*100 }));
        });
    }
});