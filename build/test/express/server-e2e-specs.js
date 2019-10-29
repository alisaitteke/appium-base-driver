"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _2 = require("../..");

var _requestPromise = _interopRequireDefault(require("request-promise"));

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _sinon = _interopRequireDefault(require("sinon"));

var _bluebird = _interopRequireDefault(require("bluebird"));

var _lodash = _interopRequireDefault(require("lodash"));

_chai.default.should();

_chai.default.use(_chaiAsPromised.default);

describe('server', function () {
  let hwServer;
  let errorStub;
  before(async function () {
    errorStub = _sinon.default.stub(console, 'error');

    function configureRoutes(app) {
      app.get('/', (req, res) => {
        res.header['content-type'] = 'text/html';
        res.status(200).send('Hello World!');
      });
      app.get('/wd/hub/python', (req, res) => {
        res.status(200).send(req.headers['content-type']);
      });
      app.get('/error', () => {
        throw new Error('hahaha');
      });
      app.get('/pause', async (req, res) => {
        res.header['content-type'] = 'text/html';
        await _bluebird.default.delay(1000);
        res.status(200).send('We have waited!');
      });
    }

    hwServer = await (0, _2.server)({
      routeConfiguringFunction: configureRoutes,
      port: 8181
    });
  });
  after(async function () {
    await hwServer.close();
    errorStub.restore();
  });
  it('should start up with our middleware', async function () {
    let body = await (0, _requestPromise.default)('http://localhost:8181/');
    body.should.eql('Hello World!');
  });
  it('should fix broken context type', async function () {
    let body = await (0, _requestPromise.default)({
      url: 'http://localhost:8181/wd/hub/python',
      headers: {
        'user-agent': 'Python',
        'content-type': 'application/x-www-form-urlencoded'
      }
    });
    body.should.eql('application/json; charset=utf-8');
  });
  it('should catch errors in the catchall', async function () {
    await (0, _requestPromise.default)('http://localhost:8181/error').should.be.rejectedWith(/hahaha/);
  });
  it('should error if we try to start again on a port that is used', async function () {
    await (0, _2.server)({
      routeConfiguringFunction() {},

      port: 8181
    }).should.be.rejectedWith(/EADDRINUSE/);
  });
  it('should wait for the server close connections before finishing closing', async function () {
    let bodyPromise = (0, _requestPromise.default)('http://localhost:8181/pause');
    await _bluebird.default.delay(100);
    let before = Date.now();
    await hwServer.close();
    (Date.now() - before).should.be.above(800);
    (await bodyPromise).should.equal('We have waited!');
  });
  it('should error if we try to start on a bad hostname', async function () {
    this.timeout(60000);
    await (0, _2.server)({
      routeConfiguringFunction: _lodash.default.noop,
      port: 8181,
      hostname: 'lolcathost'
    }).should.be.rejectedWith(/ENOTFOUND|EADDRNOTAVAIL/);
    await (0, _2.server)({
      routeConfiguringFunction: _lodash.default.noop,
      port: 8181,
      hostname: '1.1.1.1'
    }).should.be.rejectedWith(/EADDRNOTAVAIL/);
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvZXhwcmVzcy9zZXJ2ZXItZTJlLXNwZWNzLmpzIl0sIm5hbWVzIjpbImNoYWkiLCJzaG91bGQiLCJ1c2UiLCJjaGFpQXNQcm9taXNlZCIsImRlc2NyaWJlIiwiaHdTZXJ2ZXIiLCJlcnJvclN0dWIiLCJiZWZvcmUiLCJzaW5vbiIsInN0dWIiLCJjb25zb2xlIiwiY29uZmlndXJlUm91dGVzIiwiYXBwIiwiZ2V0IiwicmVxIiwicmVzIiwiaGVhZGVyIiwic3RhdHVzIiwic2VuZCIsImhlYWRlcnMiLCJFcnJvciIsIkIiLCJkZWxheSIsInJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbiIsInBvcnQiLCJhZnRlciIsImNsb3NlIiwicmVzdG9yZSIsIml0IiwiYm9keSIsImVxbCIsInVybCIsImJlIiwicmVqZWN0ZWRXaXRoIiwiYm9keVByb21pc2UiLCJEYXRlIiwibm93IiwiYWJvdmUiLCJlcXVhbCIsInRpbWVvdXQiLCJfIiwibm9vcCIsImhvc3RuYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQUEsY0FBS0MsTUFBTDs7QUFDQUQsY0FBS0UsR0FBTCxDQUFTQyx1QkFBVDs7QUFFQUMsUUFBUSxDQUFDLFFBQUQsRUFBVyxZQUFZO0FBQzdCLE1BQUlDLFFBQUo7QUFDQSxNQUFJQyxTQUFKO0FBQ0FDLEVBQUFBLE1BQU0sQ0FBQyxrQkFBa0I7QUFDdkJELElBQUFBLFNBQVMsR0FBR0UsZUFBTUMsSUFBTixDQUFXQyxPQUFYLEVBQW9CLE9BQXBCLENBQVo7O0FBQ0EsYUFBU0MsZUFBVCxDQUEwQkMsR0FBMUIsRUFBK0I7QUFDN0JBLE1BQUFBLEdBQUcsQ0FBQ0MsR0FBSixDQUFRLEdBQVIsRUFBYSxDQUFDQyxHQUFELEVBQU1DLEdBQU4sS0FBYztBQUN6QkEsUUFBQUEsR0FBRyxDQUFDQyxNQUFKLENBQVcsY0FBWCxJQUE2QixXQUE3QjtBQUNBRCxRQUFBQSxHQUFHLENBQUNFLE1B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RUEsS0FBQyxNQUFNSCxXQUFQLEVBQW9CakMsTUFBcEIsQ0FBMkJxQyxLQUEzQixDQUFpQyxpQkFBakM7QUFDRCxHQVpDLENBQUY7QUFhQVYsRUFBQUEsRUFBRSxDQUFDLG1EQUFELEVBQXNELGtCQUFrQjtBQUN4RSxTQUFLVyxPQUFMLENBQWEsS0FBYjtBQUNBLFVBQU0sZUFBTztBQUNYaEIsTUFBQUEsd0JBQXdCLEVBQUVpQixnQkFBRUMsSUFEakI7QUFFWGpCLE1BQUFBLElBQUksRUFBRSxJQUZLO0FBR1hrQixNQUFBQSxRQUFRLEVBQUU7QUFIQyxLQUFQLEVBSUh6QyxNQUpHLENBSUkrQixFQUpKLENBSU9DLFlBSlAsQ0FJb0IseUJBSnBCLENBQU47QUFLQSxVQUFNLGVBQU87QUFDWFYsTUFBQUEsd0JBQXdCLEVBQUVpQixnQkFBRUMsSUFEakI7QUFFWGpCLE1BQUFBLElBQUksRUFBRSxJQUZLO0FBR1hrQixNQUFBQSxRQUFRLEVBQUU7QUFIQyxLQUFQLEVBSUh6QyxNQUpHLENBSUkrQixFQUpKLENBSU9DLFlBSlAsQ0FJb0IsZUFKcEIsQ0FBTjtBQUtELEdBWkMsQ0FBRjtBQWFELENBbEZPLENBQVIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0cmFuc3BpbGU6bW9jaGFcblxuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSAnLi4vLi4nO1xuaW1wb3J0IHJlcXVlc3QgZnJvbSAncmVxdWVzdC1wcm9taXNlJztcbmltcG9ydCBjaGFpIGZyb20gJ2NoYWknO1xuaW1wb3J0IGNoYWlBc1Byb21pc2VkIGZyb20gJ2NoYWktYXMtcHJvbWlzZWQnO1xuaW1wb3J0IHNpbm9uIGZyb20gJ3Npbm9uJztcbmltcG9ydCBCIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5cbmNoYWkuc2hvdWxkKCk7XG5jaGFpLnVzZShjaGFpQXNQcm9taXNlZCk7XG5cbmRlc2NyaWJlKCdzZXJ2ZXInLCBmdW5jdGlvbiAoKSB7XG4gIGxldCBod1NlcnZlcjtcbiAgbGV0IGVycm9yU3R1YjtcbiAgYmVmb3JlKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBlcnJvclN0dWIgPSBzaW5vbi5zdHViKGNvbnNvbGUsICdlcnJvcicpO1xuICAgIGZ1bmN0aW9uIGNvbmZpZ3VyZVJvdXRlcyAoYXBwKSB7XG4gICAgICBhcHAuZ2V0KCcvJywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgIHJlcy5oZWFkZXJbJ2NvbnRlbnQtdHlwZSddID0gJ3RleHQvaHRtbCc7XG4gICAgICAgIHJlcy5zdGF0dXMoMjAwKS5zZW5kKCdIZWxsbyBXb3JsZCEnKTtcbiAgICAgIH0pO1xuICAgICAgYXBwLmdldCgnL3dkL2h1Yi9weXRob24nLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQocmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddKTtcbiAgICAgIH0pO1xuICAgICAgYXBwLmdldCgnL2Vycm9yJywgKCkgPT4ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2hhaGFoYScpO1xuICAgICAgfSk7XG4gICAgICBhcHAuZ2V0KCcvcGF1c2UnLCBhc3luYyAocmVxLCByZXMpID0+IHtcbiAgICAgICAgcmVzLmhlYWRlclsnY29udGVudC10eXBlJ10gPSAndGV4dC9odG1sJztcbiAgICAgICAgYXdhaXQgQi5kZWxheSgxMDAwKTtcbiAgICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQoJ1dlIGhhdmUgd2FpdGVkIScpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGh3U2VydmVyID0gYXdhaXQgc2VydmVyKHtcbiAgICAgIHJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbjogY29uZmlndXJlUm91dGVzLFxuICAgICAgcG9ydDogODE4MSxcbiAgICB9KTtcbiAgfSk7XG4gIGFmdGVyKGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBhd2FpdCBod1NlcnZlci5jbG9zZSgpO1xuICAgIGVycm9yU3R1Yi5yZXN0b3JlKCk7XG4gIH0pO1xuXG4gIGl0KCdzaG91bGQgc3RhcnQgdXAgd2l0aCBvdXIgbWlkZGxld2FyZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgYm9keSA9IGF3YWl0IHJlcXVlc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6ODE4MS8nKTtcbiAgICBib2R5LnNob3VsZC5lcWwoJ0hlbGxvIFdvcmxkIScpO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCBmaXggYnJva2VuIGNvbnRleHQgdHlwZScsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgYm9keSA9IGF3YWl0IHJlcXVlc3Qoe1xuICAgICAgdXJsOiAnaHR0cDovL2xvY2FsaG9zdDo4MTgxL3dkL2h1Yi9weXRob24nLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAndXNlci1hZ2VudCc6ICdQeXRob24nLFxuICAgICAgICAnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbiAgICAgIH1cbiAgICB9KTtcbiAgICBib2R5LnNob3VsZC5lcWwoJ2FwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgnKTtcbiAgfSk7XG4gIGl0KCdzaG91bGQgY2F0Y2ggZXJyb3JzIGluIHRoZSBjYXRjaGFsbCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBhd2FpdCByZXF1ZXN0KCdodHRwOi8vbG9jYWxob3N0OjgxODEvZXJyb3InKVxuICAgICAgLnNob3VsZC5iZS5yZWplY3RlZFdpdGgoL2hhaGFoYS8pO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCBlcnJvciBpZiB3ZSB0cnkgdG8gc3RhcnQgYWdhaW4gb24gYSBwb3J0IHRoYXQgaXMgdXNlZCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBhd2FpdCBzZXJ2ZXIoe1xuICAgICAgcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uICgpIHt9LFxuICAgICAgcG9ydDogODE4MSxcbiAgICB9KS5zaG91bGQuYmUucmVqZWN0ZWRXaXRoKC9FQUREUklOVVNFLyk7XG4gIH0pO1xuICBpdCgnc2hvdWxkIHdhaXQgZm9yIHRoZSBzZXJ2ZXIgY2xvc2UgY29ubmVjdGlvbnMgYmVmb3JlIGZpbmlzaGluZyBjbG9zaW5nJywgYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGxldCBib2R5UHJvbWlzZSA9IHJlcXVlc3QoJ2h0dHA6Ly9sb2NhbGhvc3Q6ODE4MS9wYXVzZScpO1xuXG4gICAgLy8gcmVsaW5xdWlzaCBjb250cm9sIHNvIHRoYXQgd2UgZG9uJ3QgY2xvc2UgYmVmb3JlIHRoZSByZXF1ZXN0IGlzIHJlY2VpdmVkXG4gICAgYXdhaXQgQi5kZWxheSgxMDApO1xuXG4gICAgbGV0IGJlZm9yZSA9IERhdGUubm93KCk7XG4gICAgYXdhaXQgaHdTZXJ2ZXIuY2xvc2UoKTtcbiAgICAvLyBleHBlY3Qgc2xpZ2h0bHkgbGVzcyB0aGFuIHRoZSByZXF1ZXN0IHdhaXRlZCwgc2luY2Ugd2UgcGF1c2VkIGFib3ZlXG4gICAgKERhdGUubm93KCkgLSBiZWZvcmUpLnNob3VsZC5iZS5hYm92ZSg4MDApO1xuXG4gICAgKGF3YWl0IGJvZHlQcm9taXNlKS5zaG91bGQuZXF1YWwoJ1dlIGhhdmUgd2FpdGVkIScpO1xuICB9KTtcbiAgaXQoJ3Nob3VsZCBlcnJvciBpZiB3ZSB0cnkgdG8gc3RhcnQgb24gYSBiYWQgaG9zdG5hbWUnLCBhc3luYyBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy50aW1lb3V0KDYwMDAwKTtcbiAgICBhd2FpdCBzZXJ2ZXIoe1xuICAgICAgcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uOiBfLm5vb3AsXG4gICAgICBwb3J0OiA4MTgxLFxuICAgICAgaG9zdG5hbWU6ICdsb2xjYXRob3N0JyxcbiAgICB9KS5zaG91bGQuYmUucmVqZWN0ZWRXaXRoKC9FTk9URk9VTkR8RUFERFJOT1RBVkFJTC8pO1xuICAgIGF3YWl0IHNlcnZlcih7XG4gICAgICByb3V0ZUNvbmZpZ3VyaW5nRnVuY3Rpb246IF8ubm9vcCxcbiAgICAgIHBvcnQ6IDgxODEsXG4gICAgICBob3N0bmFtZTogJzEuMS4xLjEnLFxuICAgIH0pLnNob3VsZC5iZS5yZWplY3RlZFdpdGgoL0VBRERSTk9UQVZBSUwvKTtcbiAgfSk7XG59KTtcbiJdLCJmaWxlIjoidGVzdC9leHByZXNzL3NlcnZlci1lMmUtc3BlY3MuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
