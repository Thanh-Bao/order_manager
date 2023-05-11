/*global QUnit*/

sap.ui.define([
	"order_manager/controller/SalesOrderSet.controller"
], function (Controller) {
	"use strict";

	QUnit.module("SalesOrderSet Controller");

	QUnit.test("I should test the SalesOrderSet controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
