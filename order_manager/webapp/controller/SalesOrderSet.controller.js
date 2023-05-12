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

        let totalSaleOrderSet = 0;

        return BaseController.extend("ordermanager.controller.SalesOrderSet", {
            onInit: function () {

                var oModel = new sap.ui.model.json.JSONModel({
                    SalesOrderSet: [],
                    isShowLoadMoreBtn: false,
                    loadMoreTopUserSelect: 0
                });
                this.getView().setModel(oModel, "customSalesOrderSet");

                // count BillingStatus
                countBillingStatus.map(item => {
                    this.getOwnerComponent().getModel().read("/SalesOrderSet/$count", {
                        filters: [new Filter("BillingStatus", "EQ", item.status)],
                        success: count => {
                            item.total = count;
                        }
                    })
                })

                // count SaleOrderSet
                this.getOwnerComponent().getModel().read("/SalesOrderSet/$count", {
                    success: count => {
                        totalSaleOrderSet = count
                    }
                })
            },
            onAfterRendering: function () {

                // get "load more" default value
                this.getView().getModel('customSalesOrderSet').setProperty(`/loadMoreTopUserSelect`, this.getView().getModel("config").getProperty("/SCREEN/SALES_ORDER_SET/PAGINATION_TOP_DEFAULT"));

                // get list orders for main table
                this.getView().getModel().read("/SalesOrderSet", {
                    sorters: [new Sorter("BillingStatus", true), new Sorter("SalesOrderID", true)],
                    urlParameters: {
                        $skip: this.getView().getModel("config").getProperty("/SCREEN/SALES_ORDER_SET/PAGINATION_SKIP_BEGIN"),
                        $top: this.getView().getModel("config").getProperty("/SCREEN/SALES_ORDER_SET/PAGINATION_TOP_DEFAULT")
                    },
                    success: (data) => {
                        //update main table
                        this.getView().getModel('customSalesOrderSet').setProperty(`/SalesOrderSet`, data.results);
                        //show load more button
                        this.getView().getModel('customSalesOrderSet').setProperty(`/isShowLoadMoreBtn`, true);
                    }
                })
            },
            getGroup: function (oContext) {
                return oContext.getProperty("BillingStatus");
            },
            getGroupHeader: function (oGroup) {
                let count = 0;
                countBillingStatus.forEach(o => {
                    if (o.status === oGroup.key) {
                        count = o.total;
                    }
                });
                return new sap.m.GroupHeaderListItem({
                    title: `${oGroup.key === '' ? "Billing Status empty" : oGroup.key} (${this.formatNumber(count)}) / total ${this.formatNumber(totalSaleOrderSet)}`
                });
            },
            searchTyping: function (event) {
                console.log(event.getParameters().value)
                let oModel = this.getView()
                this.getView().getModel().read("/SalesOrderSet", {
                    filters: [new Filter("SalesOrderID", "EQ", "0500000001")],
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
            },
            onChangeLoadMoreItem: function (event) {
                console.log(event.getParameters().selectedItem.getText())
                this.getView().getModel('customSalesOrderSet').setProperty("/loadMoreTopUserSelect", event.getParameters().selectedItem.getText());
            },

            onPressLoadMoreBtn: function () {
                console.log(this.getView().getModel('customSalesOrderSet').getProperty("/loadMoreTopUserSelect"));
            }

        });
    });
