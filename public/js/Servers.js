$(function() {
  var Server,
      Servers,
      ServerView,
      ServerList,
      AddFavouriteView,
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
    url: function () { return escape('/status/' + this.id); }
  });

  /**
   * Collection: Servers
   */
  Servers = Backbone.Collection.extend({
    model: Server,
    url: '/statuses'
  });

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
      'mouseleave': 'hideButtons',
      'click .close': 'removeServer'
    },

    initialize: function () {
      _.bindAll(this, 'render', 'showButtons', 'hideButtons', 'remove');
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

    // Event listeners
    showButtons: function () {
      this.$el.find('.img-block-buttons').fadeIn(200);
      return this;
    },

    hideButtons: function () {
      this.$el.find('.img-block-buttons').fadeOut(0);
      return this;
    },

    removeServer: function () {
      if (confirm('Are your sure you want to remove this server?')) {
        // Remove DOM-element
        this.$el.fadeOut(200, this.remove);
        Spawnfrag.FavouritesPage.remove(this.model);
      }

      return this;
    }
  });

  /**
   * View: ServerList
   * A list (collection) of Servers
   */
  ServerList = Backbone.View.extend({
    el: $('#server-list'),

    initialize: function () {
      _.bindAll(this, 'render', 'addServer');
      this.collection.on('reset', this.render);
    },

    // TODO: Don't count on children being available
    // Since that only happens when called from reset event.
    render: function (children) {
      var self = this;

      // Reset view
      this.$el.html('');

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
   * View: AddFavourite
   * 
   * Handles the add favourite form
   */
   // TODO: Basically this whole view has to be refactored later, prototype now.
  AddFavourite = Backbone.View.extend({
    el: $('#favourite-add'),

    events: {
      'click #btn-favourite-add': 'showModal',
      'click #btn-modal-favourite-close, .close': 'hideModal',
      'submit form': 'addServer'
    },

    initialize: function () {
      _.bindAll(this, 'addServer', 'showModal', 'hideModal');
      this.page = this.options.page;
    },

    // Event listeners
    showModal: function (e) {
      e.preventDefault();
      this.$el.children('#modal-favourite-add').modal('show');
      return this;
    },

    hideModal: function (e) {
      e.preventDefault();
      this.$el.children('#modal-favourite-add').modal('hide');
      return this;
    },

    addServer: function (e) {
      var self = this,
          $address = this.$el.find('input[name=address]'),
          $port = this.$el.find('input[name=port]'),
          address = $address.val(),
          port = parseInt($port.val(), 10);

      e.preventDefault();

      // TODO: Alot better validation, and also some nice error messages
      // and other candy stuff. Should even do a test so check that it is an qw server.
      // Check if server already is favourites.
      if (address === '' || isNaN(port)) {
        return this;
      }

      // Add server to collection and list view.
      self.collection.create({ id: address + ':' + port }, {
        success: function (model) {
          // Reset form elements
          $address.val('');
          $port.val('');
          // Hide modal again.
          self.$el.children('#modal-favourite-add').modal('hide');
          // Add to list view
          self.page.serverList.addServer(model);
        }
      });

      return this;
    }
  });

  /**
   * View: ServersPage
   */
  ServersPage = Backbone.View.extend({
    initialize: function () {
      // Server collection
      this.servers = new Servers();
      this.servers.url = '/statuses/all';
      this.servers.fetch();

      // Server list view
      this.serverList = new ServerList({ collection: this.servers });
    }
  });

  /**
   * View: FavouritesPage
   */
  FavouritesPage = Backbone.View.extend({
    initialize: function () {
      // Server collection
      this.servers = new Servers();
      this.servers.url = '/statuses';
      this.servers.fetch();

      // Server list view
      this.serverList = new ServerList({ collection: this.servers });

      // Add favourite view
      this.addFavourite = new AddFavourite({ collection: this.servers, page: this });
    }
  });

  // TODO: Maybe this isn't the best thing. Get back to this
  // implementation later.
  if (!window.Spawnfrag) {
    window.Spawnfrag = {};
  }

  //window.Spawnfrag.ServersPage = new ServersPage();
  window.Spawnfrag.FavouritesPage = new FavouritesPage();
});