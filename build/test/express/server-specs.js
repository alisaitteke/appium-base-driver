"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _ = require("../..");

var _server = require("../../lib/express/server");

var _chai = _interopRequireDefault(require("chai"));

var _chaiAsPromised = _interopRequireDefault(require("chai-as-promised"));

var _sinon = _interopRequireDefault(require("sinon"));

const should = _chai.default.should();

_chai.default.use(_chaiAsPromised.default);

describe('server configuration', function () {
  it('should actually use the middleware', function () {
    let app = {
      use: _sinon.default.spy(),
      all: _sinon.default.spy()
    };

    let configureRoutes = () => {};

    (0, _server.configureServer)(app, configureRoutes);
    app.use.callCount.should.equal(15);
    app.all.callCount.should.equal(4);
  });
  it('should reject if error thrown in configureRoutes parameter', async function () {
    const configureRoutes = () => {
      throw new Error('I am Mr. MeeSeeks look at me!');
    };

    await (0, _.server)({
      routeConfiguringFunction: configureRoutes,
      port: 8181
    }).should.be.rejectedWith('MeeSeeks');
  });
  describe('#normalizeBasePath', function () {
    it('should throw an error for paths of the wrong type', function () {
      should.throw(() => {
        (0, _server.normalizeBasePath)(null);
      });
      should.throw(() => {
        (0, _server.normalizeBasePath)(1);
      });
    });
    it('should remove trailing slashes', function () {
      (0, _server.normalizeBasePath)('/wd/hub/').should.eql('/wd/hub');
      (0, _server.normalizeBasePath)('/foo/').should.eql('/foo');
      (0, _server.normalizeBasePath)('/').should.eql('');
    });
    it('should ensure a leading slash is present', function () {
      (0, _server.normalizeBasePath)('foo').should.eql('/foo');
      (0, _server.normalizeBasePath)('wd/hub').should.eql('/wd/hub');
      (0, _server.normalizeBasePath)('wd/hub/').should.eql('/wd/hub');
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvZXhwcmVzcy9zZXJ2ZXItc3BlY3MuanMiXSwibmFtZXMiOlsic2hvdWxkIiwiY2hhaSIsInVzZSIsImNoYWlBc1Byb21pc2VkIiwiZGVzY3JpYmUiLCJpdCIsImFwcCIsInNpbm9uIiwic3B5IiwiYWxsIiwiY29uZmlndXJlUm91dGVzIiwiY2FsbENvdW50IiwiZXF1YWwiLCJFcnJvciIsInJvdXRlQ29uZmlndXJpbmdGdW5jdGlvbiIsInBvcnQiLCJiZSIsInJlamVjdGVkV2l0aCIsInRocm93IiwiZXFsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFHQSxNQUFNQSxNQUFNLEdBQUdDLGNBQUtELE1BQUwsRUFBZjs7QUFDQUMsY0FBS0MsR0FBTCxDQUFTQyx1QkFBVDs7QUFFQUMsUUFBUSxDQUFDLHNCQUFELEVBQXlCLFlBQVk7QUFDM0NDLEVBQUFBLEVBQUUsQ0FBQyxvQ0FBRCxFQUF1QyxZQUFZO0FBQ25ELFFBQUlDLEdBQUcsR0FBRztBQUFDSixNQUFBQSxHQUFHLEVBQUVLLGVBQU1DLEdBQU4sRUFBTjtBQUFtQkMsTUFBQUEsR0FBRyxFQUFFRixlQUFNQyxHQUFOO0FBQXhCLEtBQVY7O0FBQ0EsUUFBSUUsZUFBZSxHQUFHLE1BQU0sQ0FBRSxDQUE5Qjs7QUFDQSxpQ0FBZ0JKLEdBQWhCLEVBQXFCSSxlQUFyQjtBQUNBSixJQUFBQSxHQUFHLENBQUNKLEdBQUosQ0FBUVMsU0FBUixDQUFrQlgsTUFBbEIsQ0FBeUJZLEtBQXpCLENBQStCLEVBQS9CO0FBQ0FOLElBQUFBLEdBQUcsQ0FBQ0csR0FBSixDQUFRRSxTQUFSLENBQWtCWCxNQUFsQixDQUF5QlksS0FBekIsQ0FBK0IsQ0FBL0I7QUFDRCxHQU5DLENBQUY7QUFRQVAsRUFBQUEsRUFBRSxDQUFDLDREQUFELEVBQStELGtCQUFrQjtBQUNqRixVQUFNSyxlQUFlLEdBQUcsTUFBTTtBQUM1QixZQUFNLElBQUlHLEtBQUosQ0FBVSwrQkFBVixDQUFOO0FBQ0QsS0FGRDs7QUFHQSxVQUFNLGNBQU87QUFDWEMsTUFBQUEsd0JBQXdCLEVBQUVKLGVBRGY7QUFFWEssTUFBQUEsSUFBSSxFQUFFO0FBRkssS0FBUCxFQUdIZixNQUhHLENBR0lnQixFQUhKLENBR09DLFlBSFAsQ0FHb0IsVUFIcEIsQ0FBTjtBQUlELEdBUkMsQ0FBRjtBQVVBYixFQUFBQSxRQUFRLENBQUMsb0JBQUQsRUFBdUIsWUFBWTtBQUN6Q0MsSUFBQUEsRUFBRSxDQUFDLG1EQUFELEVBQXNELFlBQVk7QUFDbEVMLE1BQUFBLE1BQU0sQ0FBQ2tCLEtBQVAsQ0FBYSxNQUFNO0FBQ2pCLHVDQUFrQixJQUFsQjtBQUNELE9BRkQ7QUFHQWxCLE1BQUFBLE1BQU0sQ0FBQ2tCLEtBQVAsQ0FBYSxNQUFNO0FBQ2pCLHVDQUFrQixDQUFsQjtBQUNELE9BRkQ7QUFHRCxLQVBDLENBQUY7QUFRQWIsSUFBQUEsRUFBRSxDQUFDLGdDQUFELEVBQW1DLFlBQVk7QUFDL0MscUNBQWtCLFVBQWxCLEVBQThCTCxNQUE5QixDQUFxQ21CLEdBQXJDLENBQXlDLFNBQXpDO0FBQ0EscUNBQWtCLE9BQWxCLEVBQTJCbkIsTUFBM0IsQ0FBa0NtQixHQUFsQyxDQUFzQyxNQUF0QztBQUNBLHFDQUFrQixHQUFsQixFQUF1Qm5CLE1BQXZCLENBQThCbUIsR0FBOUIsQ0FBa0MsRUFBbEM7QUFDRCxLQUpDLENBQUY7QUFLQWQsSUFBQUEsRUFBRSxDQUFDLDBDQUFELEVBQTZDLFlBQVk7QUFDekQscUNBQWtCLEtBQWxCLEVBQXlCTCxNQUF6QixDQUFnQ21CLEdBQWhDLENBQW9DLE1BQXBDO0FBQ0EscUNBQWtCLFFBQWxCLEVBQTRCbkIsTUFBNUIsQ0FBbUNtQixHQUFuQyxDQUF1QyxTQUF2QztBQUNBLHFDQUFrQixTQUFsQixFQUE2Qm5CLE1BQTdCLENBQW9DbUIsR0FBcEMsQ0FBd0MsU0FBeEM7QUFDRCxLQUpDLENBQUY7QUFLRCxHQW5CTyxDQUFSO0FBb0JELENBdkNPLENBQVIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0cmFuc3BpbGU6bW9jaGFcblxuaW1wb3J0IHsgc2VydmVyIH0gZnJvbSAnLi4vLi4nO1xuaW1wb3J0IHsgY29uZmlndXJlU2VydmVyLCBub3JtYWxpemVCYXNlUGF0aCB9IGZyb20gJy4uLy4uL2xpYi9leHByZXNzL3NlcnZlcic7XG5pbXBvcnQgY2hhaSBmcm9tICdjaGFpJztcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tICdjaGFpLWFzLXByb21pc2VkJztcbmltcG9ydCBzaW5vbiBmcm9tICdzaW5vbic7XG5cblxuY29uc3Qgc2hvdWxkID0gY2hhaS5zaG91bGQoKTtcbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcblxuZGVzY3JpYmUoJ3NlcnZlciBjb25maWd1cmF0aW9uJywgZnVuY3Rpb24gKCkge1xuICBpdCgnc2hvdWxkIGFjdHVhbGx5IHVzZSB0aGUgbWlkZGxld2FyZScsIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgYXBwID0ge3VzZTogc2lub24uc3B5KCksIGFsbDogc2lub24uc3B5KCl9O1xuICAgIGxldCBjb25maWd1cmVSb3V0ZXMgPSAoKSA9PiB7fTtcbiAgICBjb25maWd1cmVTZXJ2ZXIoYXBwLCBjb25maWd1cmVSb3V0ZXMpO1xuICAgIGFwcC51c2UuY2FsbENvdW50LnNob3VsZC5lcXVhbCgxNSk7XG4gICAgYXBwLmFsbC5jYWxsQ291bnQuc2hvdWxkLmVxdWFsKDQpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHJlamVjdCBpZiBlcnJvciB0aHJvd24gaW4gY29uZmlndXJlUm91dGVzIHBhcmFtZXRlcicsIGFzeW5jIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBjb25maWd1cmVSb3V0ZXMgPSAoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0kgYW0gTXIuIE1lZVNlZWtzIGxvb2sgYXQgbWUhJyk7XG4gICAgfTtcbiAgICBhd2FpdCBzZXJ2ZXIoe1xuICAgICAgcm91dGVDb25maWd1cmluZ0Z1bmN0aW9uOiBjb25maWd1cmVSb3V0ZXMsXG4gICAgICBwb3J0OiA4MTgxLFxuICAgIH0pLnNob3VsZC5iZS5yZWplY3RlZFdpdGgoJ01lZVNlZWtzJyk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCcjbm9ybWFsaXplQmFzZVBhdGgnLCBmdW5jdGlvbiAoKSB7XG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBhbiBlcnJvciBmb3IgcGF0aHMgb2YgdGhlIHdyb25nIHR5cGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBzaG91bGQudGhyb3coKCkgPT4ge1xuICAgICAgICBub3JtYWxpemVCYXNlUGF0aChudWxsKTtcbiAgICAgIH0pO1xuICAgICAgc2hvdWxkLnRocm93KCgpID0+IHtcbiAgICAgICAgbm9ybWFsaXplQmFzZVBhdGgoMSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJlbW92ZSB0cmFpbGluZyBzbGFzaGVzJywgZnVuY3Rpb24gKCkge1xuICAgICAgbm9ybWFsaXplQmFzZVBhdGgoJy93ZC9odWIvJykuc2hvdWxkLmVxbCgnL3dkL2h1YicpO1xuICAgICAgbm9ybWFsaXplQmFzZVBhdGgoJy9mb28vJykuc2hvdWxkLmVxbCgnL2ZvbycpO1xuICAgICAgbm9ybWFsaXplQmFzZVBhdGgoJy8nKS5zaG91bGQuZXFsKCcnKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGVuc3VyZSBhIGxlYWRpbmcgc2xhc2ggaXMgcHJlc2VudCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgIG5vcm1hbGl6ZUJhc2VQYXRoKCdmb28nKS5zaG91bGQuZXFsKCcvZm9vJyk7XG4gICAgICBub3JtYWxpemVCYXNlUGF0aCgnd2QvaHViJykuc2hvdWxkLmVxbCgnL3dkL2h1YicpO1xuICAgICAgbm9ybWFsaXplQmFzZVBhdGgoJ3dkL2h1Yi8nKS5zaG91bGQuZXFsKCcvd2QvaHViJyk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwiZmlsZSI6InRlc3QvZXhwcmVzcy9zZXJ2ZXItc3BlY3MuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4ifQ==
