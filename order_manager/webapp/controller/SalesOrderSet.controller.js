sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Filter) {
        "use strict";

        return Controller.extend("ordermanager.controller.SalesOrderSet", {
            onInit: function () {

            },

            getGroup: function (oContext) {
                return oContext.getProperty('BillingStatus');
            },

            getGroupHeader: function (oGroup) {
                let groupCount = 0;
                // const oPromise = await new Promise(resolve => {
                //     this.getView().getModel().read('/SalesOrderSet/$count', {
                //         success: function (count) {
                //             resolve(count)
                //         },
                //         error: function (error) {
                //             console.log(error);
                //         }
                //     })
                // });

                // console.log(oPromise)

                return new sap.m.GroupHeaderListItem({
                    title: `${oGroup.key} (${groupCount})`
                });
            },

            searchTyping: function (event) {
                console.log(event.getParameters().value)
                let oModel = this.getView()
                this.getView().getModel().read("/SalesOrderSet", {
                    filters: [new Filter("SalesOrderID", "EQ", '0500000001')],
                    success: function (SalesOrderSet) {
                        console.log(SalesOrderSet)
                        let oTable = oModel.byId("tbSalesOrderSet");
                        console.log(oTable)
                    },
                    error: function (error) {
                        console.log(error);
                    }
                })
            },

            onPressSalesOrderLineItemSet: function (SalesOrderID) {
                const oRouter = this.getOwnerComponent().getRouter();
                console.log(SalesOrderID)
                oRouter.navTo("SalesOrderLineItemSet");
            }
        });
    });
