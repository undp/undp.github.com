// Model
models.Filter = Backbone.Model.extend({
    defaults: {
        active: false,
        visible: true
    },
    initialize: function() {
        if (this.collection.id === 'donors' && this.id === '00012') {
            this.set({ name: 'UNDP General Fund' }, { silent: true });
        }
    }
});

// Collections
models.Filters = Backbone.Collection.extend({
    watch: function() {
        this.update();
        app.projects.on('update', this.update, this);
    },
    update: function() {

        var collection = this,
            active = _(app.app.filters).find(function(filter) {
                return (collection.id === filter.collection);
            });

        _(collection.where({active: true })).each(function(model) {
            model.set('active', false);
        });

        if (active) {
            var model = this.get(active.id);
            var count = app.projects[collection.id][model.id];
            var budget = app.projects[collection.id + 'Budget'][model.id];
            var expenditure = app.projects[collection.id + 'Expenditure'][model.id];
            model.set({
                active: true,
                count: count,
                budget: budget,
                expenditure: expenditure
            });

        } else {
            collection.each(function(model) {
                var count = app.projects[collection.id][model.id];
                var budget = app.projects[collection.id + 'Budget'][model.id];
                var expenditure = app.projects[collection.id + 'Expenditure'][model.id];
                model.set({
                    count: count,
                    budget: budget,
                    expenditure: expenditure
                });
            });
        }
        this.trigger('update');
    },
    model: models.Filter,
    comparator: function(model) {
        return -1 * model.get('count') || 0;
    }
});
