var alfred  = require('alfred-workflow-nodejs');
var request = require('request-json');
var sugar   = require('sugar');
var config  = require('./config');

var workflow = alfred.workflow;
workflow.setName("Buildkite workflow");

var actionHandler = alfred.actionHandler;

var client = request.createClient('https://api.buildkite.com/v1/organizations/' + config.organization + '/');
client.headers['Authorization'] = "Bearer" + " " + config.api_key;

var settings = alfred.settings;
var utils = alfred.utils;

var alfred_key = "buildkite-workflow-data";

(function main() {
    var handle_items = function(items, query) {

      items = utils.filter(query, items, function(item) { return item.name });
      items = items.sortBy(function(i) { return new Date(i.featured_build.started_at) }).reverse();

      items.each(function(i) {
        var item = new alfred.Item({
            title: i.name,
            subtitle: i.featured_build.state,
            icon: './green.png',
            arg: i.web_url,
            hasSubItems: true, // set this to true to tell that this feedback has sub Items
            valid: true,
            data: {alias: "X"} // we can set data to item to use later to build sub items
        });

        workflow.addItem(item);
      })
    };

    var get_items = function(cb) {
      client.get('projects?per_page=100', function(err, res, body) { cb(body) });
    }

    var save_items = function(items) {
      settings.set(alfred_key, JSON.stringify(items));
    }

    var data = settings.get(alfred_key);

    actionHandler.onAction("update-projects", function(query) {
      get_items(function(items) {
        settings.remove(alfred_key);
        console.log(items);
        save_items(items);
      });
    });

    actionHandler.onAction("list-projects", function(query) {
      if (data) {
        handle_items(JSON.parse(data), query);
      } else {
        get_items(function(items) {
          save_items(items);
          handle_items(items, query);
        });
      }

      workflow.feedback();
    });

    alfred.run();
})();
