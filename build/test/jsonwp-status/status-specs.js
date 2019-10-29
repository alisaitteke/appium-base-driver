"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

require("source-map-support/register");

var _lodash = _interopRequireDefault(require("lodash"));

var _2 = require("../..");

var _chai = _interopRequireDefault(require("chai"));

const should = _chai.default.should();

describe('jsonwp-status', function () {
  describe('codes', function () {
    it('should export code numbers and summaries', function () {
      for (let obj of _lodash.default.values(_2.statusCodes)) {
        should.exist(obj.code);
        obj.code.should.be.a('number');
        should.exist(obj.summary);
        obj.summary.should.be.a('string');
      }
    });
  });
  describe('getSummaryByCode', function () {
    it('should get the summary for a code', function () {
      (0, _2.getSummaryByCode)(0).should.equal('The command executed successfully.');
    });
    it('should convert codes to ints', function () {
      (0, _2.getSummaryByCode)('0').should.equal('The command executed successfully.');
    });
    it('should return an error string for unknown code', function () {
      (0, _2.getSummaryByCode)(1000).should.equal('An error occurred');
    });
  });
});require('source-map-support').install();


//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3QvanNvbndwLXN0YXR1cy9zdGF0dXMtc3BlY3MuanMiXSwibmFtZXMiOlsic2hvdWxkIiwiY2hhaSIsImRlc2NyaWJlIiwiaXQiLCJvYmoiLCJfIiwidmFsdWVzIiwic3RhdHVzQ29kZXMiLCJleGlzdCIsImNvZGUiLCJiZSIsImEiLCJzdW1tYXJ5IiwiZXF1YWwiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUdBOztBQUNBOztBQUNBOztBQUdBLE1BQU1BLE1BQU0sR0FBR0MsY0FBS0QsTUFBTCxFQUFmOztBQUVBRSxRQUFRLENBQUMsZUFBRCxFQUFrQixZQUFZO0FBQ3BDQSxFQUFBQSxRQUFRLENBQUMsT0FBRCxFQUFVLFlBQVk7QUFDNUJDLElBQUFBLEVBQUUsQ0FBQywwQ0FBRCxFQUE2QyxZQUFZO0FBQ3pELFdBQUssSUFBSUMsR0FBVCxJQUFnQkMsZ0JBQUVDLE1BQUYsQ0FBU0MsY0FBVCxDQUFoQixFQUF1QztBQUNyQ1AsUUFBQUEsTUFBTSxDQUFDUSxLQUFQLENBQWFKLEdBQUcsQ0FBQ0ssSUFBakI7QUFDQUwsUUFBQUEsR0FBRyxDQUFDSyxJQUFKLENBQVNULE1BQVQsQ0FBZ0JVLEVBQWhCLENBQW1CQyxDQUFuQixDQUFxQixRQUFyQjtBQUNBWCxRQUFBQSxNQUFNLENBQUNRLEtBQVAsQ0FBYUosR0FBRyxDQUFDUSxPQUFqQjtBQUNBUixRQUFBQSxHQUFHLENBQUNRLE9BQUosQ0FBWVosTUFBWixDQUFtQlUsRUFBbkIsQ0FBc0JDLENBQXRCLENBQXdCLFFBQXhCO0FBQ0Q7QUFDRixLQVBDLENBQUY7QUFRRCxHQVRPLENBQVI7QUFVQVQsRUFBQUEsUUFBUSxDQUFDLGtCQUFELEVBQXFCLFlBQVk7QUFDdkNDLElBQUFBLEVBQUUsQ0FBQyxtQ0FBRCxFQUFzQyxZQUFZO0FBQ2xELCtCQUFpQixDQUFqQixFQUFvQkgsTUFBcEIsQ0FBMkJhLEtBQTNCLENBQWlDLG9DQUFqQztBQUNELEtBRkMsQ0FBRjtBQUdBVixJQUFBQSxFQUFFLENBQUMsOEJBQUQsRUFBaUMsWUFBWTtBQUM3QywrQkFBaUIsR0FBakIsRUFBc0JILE1BQXRCLENBQTZCYSxLQUE3QixDQUFtQyxvQ0FBbkM7QUFDRCxLQUZDLENBQUY7QUFHQVYsSUFBQUEsRUFBRSxDQUFDLGdEQUFELEVBQW1ELFlBQVk7QUFDL0QsK0JBQWlCLElBQWpCLEVBQXVCSCxNQUF2QixDQUE4QmEsS0FBOUIsQ0FBb0MsbUJBQXBDO0FBQ0QsS0FGQyxDQUFGO0FBR0QsR0FWTyxDQUFSO0FBV0QsQ0F0Qk8sQ0FBUiIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRyYW5zcGlsZTptb2NoYVxuLyogZ2xvYmFsIGRlc2NyaWJlOnRydWUsIGl0OnRydWUgKi9cblxuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB7IHN0YXR1c0NvZGVzLCBnZXRTdW1tYXJ5QnlDb2RlIH0gZnJvbSAnLi4vLi4nO1xuaW1wb3J0IGNoYWkgZnJvbSAnY2hhaSc7XG5cblxuY29uc3Qgc2hvdWxkID0gY2hhaS5zaG91bGQoKTtcblxuZGVzY3JpYmUoJ2pzb253cC1zdGF0dXMnLCBmdW5jdGlvbiAoKSB7XG4gIGRlc2NyaWJlKCdjb2RlcycsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGV4cG9ydCBjb2RlIG51bWJlcnMgYW5kIHN1bW1hcmllcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGZvciAobGV0IG9iaiBvZiBfLnZhbHVlcyhzdGF0dXNDb2RlcykpIHtcbiAgICAgICAgc2hvdWxkLmV4aXN0KG9iai5jb2RlKTtcbiAgICAgICAgb2JqLmNvZGUuc2hvdWxkLmJlLmEoJ251bWJlcicpO1xuICAgICAgICBzaG91bGQuZXhpc3Qob2JqLnN1bW1hcnkpO1xuICAgICAgICBvYmouc3VtbWFyeS5zaG91bGQuYmUuYSgnc3RyaW5nJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuICBkZXNjcmliZSgnZ2V0U3VtbWFyeUJ5Q29kZScsIGZ1bmN0aW9uICgpIHtcbiAgICBpdCgnc2hvdWxkIGdldCB0aGUgc3VtbWFyeSBmb3IgYSBjb2RlJywgZnVuY3Rpb24gKCkge1xuICAgICAgZ2V0U3VtbWFyeUJ5Q29kZSgwKS5zaG91bGQuZXF1YWwoJ1RoZSBjb21tYW5kIGV4ZWN1dGVkIHN1Y2Nlc3NmdWxseS4nKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIGNvbnZlcnQgY29kZXMgdG8gaW50cycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGdldFN1bW1hcnlCeUNvZGUoJzAnKS5zaG91bGQuZXF1YWwoJ1RoZSBjb21tYW5kIGV4ZWN1dGVkIHN1Y2Nlc3NmdWxseS4nKTtcbiAgICB9KTtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBhbiBlcnJvciBzdHJpbmcgZm9yIHVua25vd24gY29kZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGdldFN1bW1hcnlCeUNvZGUoMTAwMCkuc2hvdWxkLmVxdWFsKCdBbiBlcnJvciBvY2N1cnJlZCcpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl0sImZpbGUiOiJ0ZXN0L2pzb253cC1zdGF0dXMvc3RhdHVzLXNwZWNzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uIn0=
