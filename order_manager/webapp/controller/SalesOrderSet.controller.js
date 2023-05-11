sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("ordermanager.controller.SalesOrderSet", {
            onInit: function () {

            },

            getGroup: function (oContext) {
                return oContext.getProperty('BillingStatus');
            },

            getGroupHeader: function (oGroup) {
                return new sap.m.GroupHeaderListItem({
                    title: oGroup.key + " --> dfdf"
                });
            }
        });
    });
