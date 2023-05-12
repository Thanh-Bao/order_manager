sap.ui.define([
    "ordermanager/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
],

    function (BaseController, Filter, Sorter) {
        "use strict";
        let countBillingStatus = [{
            status: 'P',
            total: null
        },
        {
            status: '',
            total: null
        }];

        let totalSaleOrderSet = null;

        return BaseController.extend("ordermanager.controller.SalesOrderSet", {
            onInit: function () {
                var oModel = new sap.ui.model.json.JSONModel({
                    SalesOrderSet: []
                });
                this.getView().setModel(oModel, "customSalesOrderSet")
            },
            onAfterRendering: function () {
                // get list orders for main table
                this.getView().getModel().read("/SalesOrderSet", {
                    sorters: [new Sorter("SalesOrderID", true)],
                    success: (data) => {
                        this.getView().getModel('customSalesOrderSet').setProperty(`/SalesOrderSet`, data.results);
                    }
                })
                // count BillingStatus
                countBillingStatus.map(item => {
                    this.getView().getModel().read("/SalesOrderSet/$count", {
                        filters: [new Filter("BillingStatus", "EQ", item.status)],
                        success: count => {
                            item.total = count;
                        }
                    })
                })

                // count SaleOrderSet
                this.getView().getModel().read("/SalesOrderSet/$count", {
                    success: count => {
                        totalSaleOrderSet = count
                    }
                })
            },
            getGroup: function (oContext) {
                return oContext.getProperty('BillingStatus');
            },
            getGroupHeader: function (oGroup) {
                let count = null;
                countBillingStatus.forEach(o => {
                    if (o.status === oGroup.key) {
                        count = o.total;
                    }
                });
                return new sap.m.GroupHeaderListItem({
                    title: `${oGroup.key} (${this.formatNumber(count)}) / total ${this.formatNumber(totalSaleOrderSet)}`
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
