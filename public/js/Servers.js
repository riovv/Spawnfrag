$(function() {
  var Server,
      Servers,
      ServerView,
      ServerList,
      ServersPageView,
      serverCollection,
      LEVELSHOT_BASE_URL = 'http://qtv.quakeworld.nu/levelshots';

  // Mustasche-ish template syntax works smother with Jade
  // Normal syntax for evaluate and escape
  _.templateSettings = {
    interpolate : /\{\{([\s\S]+?)\}\}/g,
    evaluate : /<%([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };

  /**
   * Model: Server
   */
  Server = Backbone.Model.extend({
    Collection: serverCollection,

    url: function () { return escape('/status/' + this.id); }
  });

  /**
   * Collection: Servers
   */
  Servers = Backbone.Collection.extend({
    model: Server,
    url: '/status'
  });

  // Instance of Server Collection.
  serverCollection = new Servers();

  /**
   * View: ServerView
   * A single Server
   */
  ServerItem = Backbone.View.extend({
    tagName: 'article',
    className: 'server-item span3',
    template: _.template($('#server-item-template').html()),
    levelshot_template: _.template('<img src="{{ src }}" class="img-polaroid img-levelshot"/>'),

    events: {
      'mouseenter': 'showButtons',
      'mouseleave': 'hideButtons'
    },

    initialize: function () {
      _.bindAll(this, 'render');
    },

    render: function () {
      var levelshot = this.levelshot_template({ src: LEVELSHOT_BASE_URL + '/' + this.model.get('map') + '.jpg' });

      // Create a DOM-friendly id class out of the host
      this.$el.addClass('server-id-' + this.model.get('id').replace(/[\.]/g, '_').replace(/[\:]/g, '_'));

      // Render the whole view
      this.$el.html(this.template({
        hostname: this.model.get('hostname'),
        id: this.model.get('id'),
        qtv: this.model.get('qtv'),
        clients_status: this.model.get('clients_status'),
        clients: this.model.get('clients'),
        maxclients: this.model.get('maxclients'),
        levelshot: levelshot
      }));

      return this;
    },

    showButtons: function () {
      this.$el.find('.img-block-buttons').fadeIn(200);
    },
    hideButtons: function () {
      this.$el.find('.img-block-buttons').fadeOut(0);
    }
  });

  /**
   * View: ServerList
   * A list (collection) of Servers
   */
  ServerList = Backbone.View.extend({
    Collection: serverCollection,
    el: $('#server-list'),

    initialize: function () {
      _.bindAll(this, 'render');
      this.Collection.on('reset', this.render);
      this.Collection.fetch();
    },

    render: function (children) {
      var self = this;

      children.each(function (child) {
        self.addServer(child);
      });

      return this;
    },

    addServer: function (server) {
      var lastRow = this.$el.children('div.row:last'),
          nItems = $(lastRow).children('.server-item').length,
          row = (nItems > 0 && nItems < 4) ? lastRow : $('<div class="row"></div>').appendTo(this.$el);

      row.append(new ServerItem({ model: server }).render().el);
    }
  });

  /**
   * View: ServersPageView
   */
  ServersPageView = Backbone.View.extend({
    initialize: function () {
      this.serverList = new ServerList();
    }
  });

  // Expost collection and page view to the global scope.
  window.serverCollection = serverCollection;
  window.pageView = new ServersPageView();
});