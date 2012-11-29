// Models
models.TopDonor = Backbone.Model.extend({
});

// Collections
models.TopDonors = Backbone.Collection.extend({
    model: models.TopDonor,
    comparator: function(model) {
      return -1 * model.get('amount');
    }
});