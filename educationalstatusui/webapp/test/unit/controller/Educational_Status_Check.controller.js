/*global QUnit*/

sap.ui.define([
	"com/lt/educationalstatusui/controller/Educational_Status_Check.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Educational_Status_Check Controller");

	QUnit.test("I should test the Educational_Status_Check controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
