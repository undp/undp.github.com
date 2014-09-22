views.Facets = Backbone.View.extend({
	el: '#filter-items',
	template:_.template($('#facet').html()),
	initialize:function(){
		_.bindAll(this,'render');
		this.collection = new Facets();
		this.render();
	},
	render:function(){
		var facetHTML = '';

		this.collection.each(function(facet){

			facetHTML += this.template({
				id: facet.get('id'),
				name: facet.get('name')
			});

			//set up filters (values in the collection) for the facet
	        facet.subFilters = new Filters();

	        facet.subFilters.id = facet.get('id');
	        facet.subFilters.name = facet.get('name');
	        facet.subFilters.url = facet.get('url');

			facet.subFilters.fetch({
				success: function () {

			        new views.Filters({
						el:'#' + facet.id,
						collection: facet.subFilters
			        });

					facet.subFilters.watch();
				}
			});

		},this) // ensure the context refers to the view, so that var that = this is not needed

		this.$el.html(facetHTML); // create the topics/facets divs
	}
});