views.ProjectProfile = Backbone.View.extend({
    events: {
        'click .widget-config': 'requestIframe',
        'click .load a': 'loadMore'
    },

    initialize: function() {
        this.render();
        var outputID = this.options.gotoOutput;
        if (outputID) {
            window.setTimeout(function() { window.scrollTo(0, $('#output-' + outputID).offset().top); }, 0);
        }

        $('#all-projects').on('click', function(e) {
            if (app.app) {
                e.preventDefault();
                window.history.back();
            }
        });

        $('#profile .summary').removeClass('off');
        this.low = 10,
        this.high = 10;
    },

    render: function() {
        $('#breadcrumbs ul').html(
            '<li><a href="http://www.undp.org/content/undp/en/home.html">Home</a></li>' +
            '<li><a href="' + BASE_URL + '">Our Projects</a></li>' +
            '<li><a href="#' + CURRENT_YR + '/filter/operating_unit-' + this.model.get('operating_unit_id') + '">' + this.model.get("operating_unit") + '</a></li>' +
            '<li><a href="#project/' + this.model.get('id') + '">' + this.model.get('id') + '</a></li>'
        );

        var start = this.model.get('start').split('-');
        var end = this.model.get('end').split('-');

        var startDate = new Date(start[0],start[1]-1,start[2]),
            endDate = new Date(end[0],end[1]-1,end[2]),
            curDate = new Date(),
            progress = ((curDate - startDate) / (endDate - startDate)) * 100;
            that = this;

        this.model.attributes.budget = _.chain(this.model.attributes.outputs)
            .map(function (o) { return o.budget; })
            .flatten()
            .reduce(function(memo, num){ return memo + num; }, 0)
            .value();

        this.model.attributes.expenditure = _.chain(this.model.attributes.outputs)
            .map(function (o) { return o.expenditure; })
            .flatten()
            .reduce(function(memo, num){ return memo + num; }, 0)
            .value();

        this.model.attributes.budgetyears = _.reduce(this.model.attributes.outputs, function (res, obj) {
            _.each(obj.fiscal_year, function(o,i) {
                res[o] = (res[o] || 0) + obj.budget[i];
            });
            return res;
            },{});

        this.model.attributes.expendyears = _.reduce(this.model.attributes.outputs, function (res, obj) {
            _.each(obj.fiscal_year, function(o,i) {
                res[o] = (res[o] || 0) + obj.expenditure[i];
            });
            return res;
            },{});

        var s = this.model.get('start').split('-');
        var e = this.model.get('end').split('-');

        var start = new Date(s[0],s[1]-1,s[2]).format('M d, Y');
        var end = new Date(e[0],e[1]-1,e[2]).format('M d, Y');

        var documents = [];
        if (this.model.get('document_name')) {
            
            var filterDocNames = _(this.model.get('document_name')[0]).filter(function(n) {
                return !(/\.(gif|jpg|jpeg|tiff|png)$/i).test(n);
            });
            var filterDocUrls = _(this.model.get('document_name')[1]).filter(function(d) {
                return !(/\.(gif|jpg|jpeg|tiff|png)$/i).test(d);
            });
            
            
             if (filterDocNames.length !== 0) {
                _(filterDocNames).each(function(d, i) {
                    documents[i] = {};
                    var title = d;
                    if (title.length > 38) {
                        documents[i].title = title.substring(0, 38) + '...';
                    } else {
                        documents[i].title = title;
                    }
                    documents[i].filetype = d.split('.').pop();
                });
                _(filterDocUrls).each(function(d, i) {
                    documents[i].src = d;
                });
            }
        }

        window.setTimeout(function() { $('html, body').scrollTop(0); }, 0);

        if (this.options.embed) {
            this.$el.empty().append(templates.embedProjectProfile({
                start: start,
                end: end,
                documents: documents,
                model: this.model
            }));

            // Depending on the options passed into the array add a fade
            // in class to all elements containing a data-option attribute
            if (this.options.embed) {
                _(this.options.embed).each(function (o) {
                    $('[data-option="' + o + '"]').show();
                });
            }

        } else {
            this.$el.empty().append(templates.projectProfile({
                start: start,
                end: end,
                base: BASE_URL,
                documents: documents,
                model: this.model
            })).show();
        }

        // If first load is a project page or output, don't animate
        if (app.app && this.options.gotoOutput === false) {
            $('#profile .summary').addClass('off');
        }

        this.map = new views.ProjectMap({
            el: '#profilemap',
            model: this.model,
            embed: this.options.embed,
            render: true
        });

        $('#progress').find('.bar').css('width', progress + '%');

        this.$('#outputs').empty();
        if (this.model.attributes.outputs) {
            var outputs = this.model.attributes.outputs.slice(0, 9);
            _(outputs).each(function(model) {
                this.$('#outputs').append(templates.projectOutputs({ model: model }));
            });
    
            // Project Outputs
            if (this.model.attributes.outputs.length < 10) {
                $('.load').hide();
            } else {
                $('.load').show();
            }
        }

        // Append menu items to the breadcrumb
        $('breadcrumbs').find('ul').remove();

        return this;
    },

    requestIframe: function() {
        var context = $('#widget');
        widgetOpts = ['title','map','outputs'];

        $('.widget-options a',context).removeClass('active');
        _(widgetOpts).each(function(widgetTitle){
            var widgetEl =widgetTitle + '-opt';
            $("." + widgetEl).find('a').addClass('active');
        })

        embedPath = location.hash.replace('project', 'widget/project');

        defaultIframe = '<iframe src="{{site.baseurl}}/embed.html' + embedPath + '?' +
        widgetOpts.join('&') +
        '" width="680" height="500" frameborder="0"> </iframe>';
        $('.widget-preview', context).html(defaultIframe);
        $('.widget-code', context)
            .val(defaultIframe.replace('src="{{site.baseurl}}/','src="' + BASE_URL))
            .select();
    },

    loadMore: function(e) {
        this.low = this.high;
        this.high += 10;

        var outputs = this.model.attributes.outputs.slice(this.low, this.high);

        if (outputs.length) {
            _(outputs).each(function(model) {
                this.$('#outputs').append(templates.projectOutputs({ model: model }));
            });
        } else {
            $(e.target).text('All Projects Loaded').addClass('disabled');
        }

        return false;
    }

});
