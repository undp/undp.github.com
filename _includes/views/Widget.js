views.Widget = Backbone.View.extend({
    el: '#widget',

    events: {
       'click .widget-options a': 'widgetOptions',
       'click .widget-code': 'inputSelect'
    },

    initialize: function () {
        this.destroy();
        this.render();
    },

    render: function(keypress) {
        var view = this;

        $(this.el).empty().append(templates.widget());

        if (view.options.context === 'projects') {
            $('.proj-opt', view.$el).hide();
            $('.main-opt', view.$el).show();
        } else {
            $('.main-opt', view.$el).hide();
            $('.proj-opt', view.$el).show();
        }

        return this;
    },

    destroy: function() {
        this.undelegateEvents();
        $(this.el).removeData().unbind();
    },

    widgetOptions: function(e) {
        var view = this;
        view.path = '#widget/';

        if (location.hash !== '') {
            view.path = location.hash
                .replace('filter', 'widget')
                .replace('project', 'widget/project');
        }
        var $el = $(e.target);
        var opt = $el.attr('data-value');

        if ($el.hasClass('active')) {
            $el.removeClass('active');
            widgetOpts.splice(widgetOpts.indexOf(opt), 1);
        } else {
            $el.addClass('active');
            widgetOpts.push(opt);
        }

        if (widgetOpts.length !== 0) {
            view.widgetCode = '<iframe src="' + BASE_URL +
                'embed.html' + view.path + '?' +
                widgetOpts.join('&') +
                '" width="500" height="360" frameborder="0"> </iframe>';

            $('.widget-preview', view.$el).html(view.widgetCode);
            $('.widget-code', view.$el)
                .show()
                .val(view.widgetCode)
                .select();
        } else {
            $('.widget-preview', view.$el).html('<h3 class="empty">To use this widget choose some options on the left.</h3>');
            $('.widget-code', view.$el)
                .hide();
        }

        return false;
    },

    inputSelect: function(e) {
        $(e.target).select();
    }
});
