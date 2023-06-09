sap.ui.define([
    "sap/ui/core/mvc/Controller",
], function (Controller) {
    "use strict";
    return Controller.extend("ordermanager.controller.BaseController", {
        formatNumber: number => {
            try {
                return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
            } catch {
                return number;
            }

        }
    });
});