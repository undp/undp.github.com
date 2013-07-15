---
---
var CURRENT_YR = FISCALYEARS[0];
$(function() {
    var BASE_URL = 'http://akshaysinha.github.io/test/',
        widgetOts = [],
        models = {},
        views = {},
        routers = {},
        templates = _($('script[name]')).reduce(function(memo, el) {
            memo[el.getAttribute('name')] = _(el.innerHTML).template();
            return memo;
        }, {}),
        app = {},
        facets = [
            {
                id: 'operating_unit',
                url: 'api/operating-unit-index.json',
                name: 'Country Office / Operating Unit'
            },
            {
                id: 'region',
                url: 'api/region-index.json',
                name: 'Region'
            },
            {
                id: 'focus_area',
                url: 'api/focus-area-index.json',
                name: 'UNDP Focus Area'
            },
            {
                id: 'donor_countries',
                url: 'api/donor-country-index.json',
                name: 'Funding by Country'
            },
            {
                id: 'donors',
                url: 'api/donor-index.json',
                name: 'Budget Source'
            }
        ];

    // Models
    {% include models/Filter.js %}
    {% include models/Project.js %}
    {% include models/TopDonor.js %}

    // Views
    {% include views/App.js %}
    {% include views/Filters.js %}
    {% include views/Projects.js %}
    {% include views/ProjectProfile.js %}
    {% include views/Map.js %}
    {% include views/ProjectMap.js %}
    {% include views/HDI.js %}
    {% include views/TopDonors.js %}
    {% include views/Widget.js %}

    // Router
    {% include routers/Router.js %}

    // String helper
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };
    
    // Script loader
    function loadjsFile(filename, year, callback) {
        $('#fiscalData').empty();
        var fileref = document.createElement('script');
        fileref.setAttribute('type', 'text/javascript');
        fileref.setAttribute('id', 'y' + year);
        fileref.setAttribute('src', filename);
        
        //calling a function after the js is loaded (IE)
        var loadFunction = function() {  
            if (this.readyState == 'complete' || this.readyState == 'loaded') {  
                callback();
            }  
        };
        fileref.onreadystatechange = loadFunction;  
  
        //calling a function after the js is loaded (Chrome/Firefox)  
        fileref.onload = callback;
        
        document.getElementById('fiscalData').appendChild(fileref);
    }

    // Via https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
            'use strict';
            if (this == null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n != 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }
    }

    // To Title Case 2.0.1 – http://individed.com/code/to-title-case/
    // Copyright © 2008–2012 David Gouch. Licensed under the MIT License.
    String.prototype.toTitleCase = function () {
      var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|vs?\.?|via)$/i;

      return this.replace(/([^\W_]+[^\s\-]*) */g, function (match, p1, index, title) {
        if (index > 0 && index + p1.length !== title.length &&
          p1.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
          title.charAt(index - 1).search(/[^\s\-]/) < 0) {
          return match.toLowerCase();
        }

        if (p1.substr(1).search(/[A-Z]|\../) > -1) {
          return match;
        }

        return match.charAt(0).toUpperCase() + match.substr(1);
      })
        // Words that should be all caps
        .replace(/Un\b/g, 'UN ')
        .replace(/Undp/g, 'UNDP')
        .replace(/Unesco/g, 'UNESCO')
        .replace(/Unfip/g, 'UNFIP')
        .replace(/Unocha\/central_emg_resp_fund/g, 'UNOCHA Central Emg Resp Fund')
        .replace(/Unocha/g, 'UNOCHA')
        .replace(/Mdtfo\\jp_mdg-F_conflict_\&_pb/g, 'MDTFO / JP MDG-F Conflict & PB')
        .replace(/Bcpr/g, 'BCPR')
        .replace(/Dfid/g, 'DFID')
        .replace(/Usaid/g, 'USAID')
        .replace(/Unaids/g, 'UNAIDS')
        .replace(/Mdtfo\\jp_peace_building_fund/g, 'MDTFO / JP Peace Building Fund')
        .replace(/Aa for Jp/g, 'AA for JP')
        .replace(/Gtz\b/g, 'GTZ')
        .replace(/Mdg\b/g, 'MDG')
        .replace(/Hiv\b/g, 'HIV')
        .replace(/Bra\b/g, 'BRA')
        .replace(/Ii\b/g, 'II')
        .replace(/Iii\b/g, 'III')
        .replace(/Iv\b/g, 'IV')
        .replace(/Vi\b/g, 'VI')
        .replace(/Vii\b/g, 'VII');
    };
    
    //localize map tilejson
    var TJ = {
        attribution: "<a href='http://mapbox.com/about/maps' target='_blank'>Terms & Feedback</a>",
        bounds: [
            -180,
            -85,
            180,
            85
        ],
        center: [
            0,
            0,
            2
        ],
        id: "undp.map-6grwd0n3",
        maxzoom: 17,
        minzoom: 2,
        name: "UNDP base layer",
        private: true,
        scheme: "xyz",
        tilejson: "2.0.0",
        tiles: [
            "http://a.tiles.mapbox.com/v3/undp.map-6grwd0n3/{z}/{x}/{y}.png",
            "http://b.tiles.mapbox.com/v3/undp.map-6grwd0n3/{z}/{x}/{y}.png",
            "http://c.tiles.mapbox.com/v3/undp.map-6grwd0n3/{z}/{x}/{y}.png",
            "http://d.tiles.mapbox.com/v3/undp.map-6grwd0n3/{z}/{x}/{y}.png"
        ],
        webpage: "http://tiles.mapbox.com/undp/map/map-6grwd0n3"
    };
    
    // About nav toggle
    $('#mainnav a.parent-link').click(function(e) {
        e.preventDefault();
        var $target = $(e.target);
        if ($target.parent().hasClass('parent-active')) {
            $target.parent().removeClass('parent-active');
        } else {
            $target.parent().addClass('parent-active');
        }
    });

    // Start the application
    $(function() {
        app = new routers.App();
        Backbone.history.start();
    });
});
